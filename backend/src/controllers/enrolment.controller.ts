import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

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
// @Route   GET   /api/enrolments/checkout
export const createTransaction = async (
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
