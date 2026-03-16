import { verifyBakongTransaction } from '../utils/verifyBakongTransaction';
import { RequestWithUser } from '../middleware/auth.middleware';
import { Request, Response, NextFunction } from 'express';
import { COUNTRY, CURRENCY, KHQR, TAG } from 'ts-khqr';
import { prisma } from '../config/db';
import config from '../config/config';

// @desc    show course's price summary   (PUBLIC)
// @Route   GET   /api/enrolments/summary/:id
/**
 * @swagger
 * /api/enrolments/summary/{id}:
 *   get:
 *     summary: Get course price summary
 *     description: Returns a price breakdown for a course including any applicable discounts. This endpoint is public and does not require authentication.
 *     tags: [Enrolments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the course
 *     responses:
 *       "200":
 *         description: Course summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Course summary retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Full-Stack Web Development Bootcamp
 *                     originalPrice:
 *                       type: number
 *                       example: 19.99
 *                     appliedDiscount:
 *                       type: string
 *                       example: 20%
 *                     discountSavings:
 *                       type: string
 *                       example: '4.00'
 *                     totalPrice:
 *                       type: string
 *                       example: '15.99'
 *                     inventoryStatus:
 *                       type: string
 *                       example: Discount available (5 left)
 *       "404":
 *         $ref: '#/components/responses/404'
 */
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
/**
 * @swagger
 * /api/enrolments/checkout/{id}:
 *   get:
 *     summary: Generate a KHQR payment QR code for a course (Auth Only)
 *     description: Creates or resets a pending enrolment and returns a KHQR code for the user to scan and pay. The QR code expires in 2 minutes.
 *     tags: [Enrolments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the course to enrol in
 *     responses:
 *       "200":
 *         description: Transaction created and QR generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Transaction created and QR generated
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrolmentId:
 *                       type: string
 *                       example: clx123abc
 *                     qr:
 *                       type: string
 *                       description: The KHQR string to render as a QR code
 *                       example: 00020101021229...
 *                     md5:
 *                       type: string
 *                       description: MD5 hash used to verify the transaction status
 *                       example: a1b2c3d4e5f6...
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "404":
 *         $ref: '#/components/responses/404'
 */
export const createTransaction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    // course id
    const { id: courseId } = req.params as { id: string };
    const userId = req.user.id;

    // Find existing course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
      currency: CURRENCY.USD,
      amount: finalAmount,
      countryCode: COUNTRY.KH,
      expirationTimestamp: Date.now() + 2 * 60 * 1000, // 2 minutes = 120s
      additionalData: {
        storeLabel: config.bakong_store_label,
        terminalLabel: config.bakong_terminal_label,
      },
    });

    const enrolment = await prisma.enrolment.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      update: {
        status: 'pending',
        priceAtSale: finalAmount,
      },
      create: {
        userId,
        courseId,
        priceAtSale: finalAmount,
        status: 'pending',
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

// @desc    verify the payment transaction   (AUTH ONLY)
// @Route   POST   /api/enrolments/checkout
/**
 * @swagger
 * /api/enrolments/checkout:
 *   post:
 *     summary: Verify a KHQR payment transaction (Auth Only)
 *     description: Verifies the payment using the MD5 hash from the QR code. On success, the enrolment status is updated and any applicable discount inventory is decremented.
 *     tags: [Enrolments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - md5
 *               - enrolmentId
 *             properties:
 *               md5:
 *                 type: string
 *                 description: The MD5 hash returned from the QR generation step
 *                 example: a1b2c3d4e5f6...
 *               enrolmentId:
 *                 type: string
 *                 description: The enrolment ID returned from the QR generation step
 *                 example: clx123abc
 *     responses:
 *       "200":
 *         description: Payment verified successfully (or already verified)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
 *       "400":
 *         description: Payment failed — transaction not yet received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 'Payment failed! Transaction not yet received'
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "404":
 *         description: Enrolment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Enrolment not found
 */
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
/**
 * @swagger
 * /api/enrolments/checkout/{id}:
 *   patch:
 *     summary: Cancel a pending transaction (Auth Only)
 *     description: Cancels a pending enrolment transaction by its ID. Users can only cancel their own transactions.
 *     tags: [Enrolments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the enrolment to cancel
 *     responses:
 *       "200":
 *         description: Payment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Payment cancelled successfully
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "404":
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Transaction not found
 */
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
