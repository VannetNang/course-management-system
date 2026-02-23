import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { COUNTRY, CURRENCY, KHQR, TAG } from 'ts-khqr';
import config from '../config/config';

// @desc    show course's price summary   (PUBLIC)
// @Route   GET   /api/enrolments/summary/:id
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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

    // Else, create transaction
    const result = KHQR.generate({
      tag: TAG.INDIVIDUAL,
      accountID: config.bakong_account_id,
      merchantName: config.bakong_merchant_name,
      merchantCity: config.bakong_merchant_city,
      currency: CURRENCY.KHR,
      amount: Number(course.price),
      countryCode: COUNTRY.KH,
      expirationTimestamp: Date.now() + 1 * 60 * 1000, // 1 minute
      additionalData: {
        storeLabel: config.bakong_store_label,
        terminalLabel: config.bakong_terminal_label,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Course summary retrieved successfully',
      data: {
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
    res.status(200).json({
      status: 'success',
      message: 'Course summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    cancel the transaction   (AUTH ONLY)
// @Route   DELETE   /api/enrolments/checkout/:id
export const cancelTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Enrolment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
