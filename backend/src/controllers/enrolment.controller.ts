import { verifyBakongTransaction } from '../utils/verifyBakongTransaction';
import { RequestWithUser } from '../middleware/auth.middleware';
import { Request, Response, NextFunction } from 'express';
import { COUNTRY, CURRENCY, KHQR, TAG } from 'ts-khqr';
import { prisma } from '../config/db';
import config from '../config/config';

// @desc    show course's price summary   (PUBLIC)
// @Route   GET   /api/enrolments/summary/:id
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // course id
    const { id } = req.params as { id: string };

    // Find existing course with id
    const course = await prisma.course.findUnique({
      where: {
        id: id,
      },
    });

    // If not found
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
      });
    }

    // Determine if discount is applicable
    const isDiscountAvailable = course.discountQuantity > 0; // quantity
    const finalDiscount = isDiscountAvailable ? course.discount : 0; // rate

    // Math: Price - (Price * (Discount / 100))
    const discountAmount = (Number(course.price) * Number(finalDiscount)) / 100;
    const totalPrice = Number(course.price) - discountAmount;

    const courseInfo = {
      title: course.title,
      originalPrice: course.price,
      appliedDiscount: `${finalDiscount}%`,
      discountSavings: discountAmount.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      inventoryStatus: isDiscountAvailable
        ? `Discount available (${course.discountQuantity} left)`
        : 'Full price (Discount sold out)',
    };

    res.status(200).json({
      status: 'success',
      message: 'Course summary retrieved successfully',
      data: courseInfo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    show QR CODE   (AUTH ONLY)
// @Route   GET   /api/enrolments/checkout/:id
export const createTransaction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    // course id
    const { id } = req.params as { id: string };

    // Find existing course
    const course = await prisma.course.findUnique({
      where: { id: id },
    });

    // If not found
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
      });
    }

    // Else, apply discount logic first if that course has discount
    const discount = course.discountQuantity > 0 ? Number(course.discount) : 0;
    const finalAmount = Math.round(Number(course.price) * (1 - discount / 100));

    // Then, create transaction
    const result = KHQR.generate({
      tag: TAG.INDIVIDUAL,
      accountID: config.bakong_account_id,
      merchantName: config.bakong_merchant_name,
      merchantCity: config.bakong_merchant_city,
      currency: CURRENCY.KHR,
      amount: finalAmount,
      countryCode: COUNTRY.KH,
      expirationTimestamp: Date.now() + 1 * 60 * 1000, // 1 minute
      additionalData: {
        storeLabel: config.bakong_store_label,
        terminalLabel: config.bakong_terminal_label,
      },
    });

    const enrolment = await prisma.enrolment.create({
      data: {
        userId: req.user.id,
        courseId: course.id,
        priceAtSale: finalAmount,
        progress: 0,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Transaction created and QR generated',
      data: {
        enrolmentId: enrolment.id,
        qr: result.data?.qr,
        md5: result.data?.md5,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    modify the payment transaction from user   (AUTH ONLY)
// @Route   POST   /api/enrolments/checkout
export const modifyTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { md5, enrolmentId } = req.body;

    // Check existing enrolment
    const enrolment = await prisma.enrolment.findUnique({
      where: { id: enrolmentId },
    });

    // If not found
    if (!enrolment) {
      return res.status(404).json({
        status: 'error',
        message: 'Enrolment not found',
      });
    }

    // If already success, don't run the logic again
    if (enrolment.status === 'success') {
      return res.status(200).json({
        status: 'success',
        message: 'Payment already verified',
      });
    }

    // Else, check the transaction
    const result = await verifyBakongTransaction(md5);

    // If not success
    if (result.data.responseCode !== 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment failed! Transaction not yet received',
      });
    }

    // If success -> update the status and discount quantity
    // Use transaction to ensure the payment doesn't go wrong
    await prisma.$transaction(async (tx) => {
      // Update enrolment status
      await tx.enrolment.update({
        where: { id: enrolmentId },
        data: { status: 'success' },
      });

      // Then, handle Discount Inventory
      // We only decrement if the course has a discount available
      const course = await tx.course.findUnique({
        where: { id: enrolment.courseId },
      });

      if (course && course.discountQuantity > 0) {
        await tx.course.update({
          where: { id: enrolment.courseId },
          data: {
            discountQuantity: { decrement: 1 },
          },
        });
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    cancel the transaction   (AUTH ONLY)
// @Route   PATCH   /api/enrolments/checkout/:id
export const cancelTransaction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.id;
    const { id: enrolmentId } = req.params as { id: string };

    // Find existing enrolment
    const enrolment = await prisma.enrolment.findFirst({
      where: { id: enrolmentId, userId: userId },
    });

    // If not found
    if (!enrolment) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    // Else, update the status to 'cancelled'
    await prisma.enrolment.update({
      where: { id: enrolmentId, userId: userId },
      data: { status: 'cancelled' },
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
