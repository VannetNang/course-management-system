'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  discount: z.coerce.number().min(0).max(100).default(0),
  discountQuantity: z.coerce.number().int().min(0).default(0),
  thumbnail: z.any().optional(),
});

type CreateCourseInput = z.infer<typeof createCourseSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema) as any,
    defaultValues: {
      discount: 0,
      discountQuantity: 0,
    },
  });

  const onSubmit = async (data: CreateCourseInput) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', String(data.price));
      formData.append('discount', String(data.discount ?? 0));
      formData.append('discountQuantity', String(data.discountQuantity ?? 0));
      if (data.thumbnail?.[0]) {
        formData.append('thumbnail', data.thumbnail[0]);
      }

      await api.post('/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Course created!');
      router.push('/admin/courses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Course</h1>
        <p className="text-muted-foreground mt-1">Create a new course</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input {...register('title')} placeholder="e.g. Introduction to React" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <textarea
                {...register('description')}
                placeholder="Describe your course..."
                className="w-full min-h-24 px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" min="0" {...register('price')} placeholder="9.99" />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Discount (%)</Label>
                <Input type="number" min="0" max="100" {...register('discount')} defaultValue={0} />
                {errors.discount && <p className="text-sm text-red-500">{errors.discount.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Discount Qty</Label>
                <Input type="number" min="0" {...register('discountQuantity')} defaultValue={0} />
                {errors.discountQuantity && <p className="text-sm text-red-500">{errors.discountQuantity.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Thumbnail</Label>
              <Input type="file" accept="image/*" {...register('thumbnail')} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Course'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
