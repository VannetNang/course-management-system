'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCourse, Course } from '@/lib/courses';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, Loader2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

const editCourseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  price: z.coerce.number().positive().optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  discountQuantity: z.coerce.number().int().min(0).optional(),
  thumbnail: z.any().optional(),
});

const lessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  video: z.any().optional(),
});

type EditCourseInput = z.infer<typeof editCourseSchema>;
type LessonInput = z.infer<typeof lessonSchema>;

function isValidUrl(url: string) {
  return url?.startsWith('http://') || url?.startsWith('https://');
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingLesson, setAddingLesson] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const courseForm = useForm<EditCourseInput>({ resolver: zodResolver(editCourseSchema) as any });
  const lessonForm = useForm<LessonInput>({ resolver: zodResolver(lessonSchema) as any });

  useEffect(() => {
    getCourse(id)
      .then((data) => {
        setCourse(data);
        courseForm.reset({
          title: data.title,
          description: data.description,
          price: data.price,
          discount: data.discount,
          discountQuantity: data.discountQuantity,
        });
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [id]);

  const onUpdateCourse = async (data: EditCourseInput) => {
    try {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.price) formData.append('price', String(data.price));
      if (data.discount !== undefined) formData.append('discount', String(data.discount));
      if (data.discountQuantity !== undefined) formData.append('discountQuantity', String(data.discountQuantity));
      if (data.thumbnail?.[0]) formData.append('thumbnail', data.thumbnail[0]);

      await api.put(`/courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Course updated!');
      router.push('/admin/courses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update course');
    }
  };

  const onAddLesson = async (data: LessonInput) => {
    setAddingLesson(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.video?.[0]) formData.append('video', data.video[0]);

      const res = await api.post(`/lessons/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newLesson = res.data.data ?? res.data;
      setCourse((prev) => prev ? { ...prev, lessons: [...(prev.lessons ?? []), newLesson] } : prev);
      lessonForm.reset();
      setShowLessonForm(false);
      toast.success('Lesson added!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add lesson');
    } finally {
      setAddingLesson(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      setCourse((prev) => prev ? { ...prev, lessons: prev.lessons.filter((l) => l.id !== lessonId) } : prev);
      toast.success('Lesson deleted');
    } catch {
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  if (!course) return <div className="text-center text-muted-foreground">Course not found.</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-muted-foreground mt-1">{course.title}</p>
      </div>

      {/* Edit course form */}
      <Card>
        <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={courseForm.handleSubmit(onUpdateCourse)} className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input {...courseForm.register('title')} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <textarea
                {...courseForm.register('description')}
                className="w-full min-h-24 px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" {...courseForm.register('price')} />
              </div>
              <div className="space-y-1">
                <Label>Discount (%)</Label>
                <Input type="number" {...courseForm.register('discount')} />
              </div>
              <div className="space-y-1">
                <Label>Discount Qty</Label>
                <Input type="number" {...courseForm.register('discountQuantity')} />
              </div>
            </div>

            {/* Thumbnail preview + upload */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              {isValidUrl(course.thumbnail) && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                  <Image src={course.thumbnail} alt="Current thumbnail" fill className="object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Current thumbnail
                  </div>
                </div>
              )}
              <Input type="file" accept="image/*" {...courseForm.register('thumbnail')} />
              <p className="text-xs text-muted-foreground">Upload a new image to replace the current one</p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={courseForm.formState.isSubmitting}>
                {courseForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lessons ({course.lessons?.length ?? 0})</h2>
          <Button size="sm" onClick={() => setShowLessonForm(!showLessonForm)}>
            <Plus className="w-4 h-4 mr-1" /> Add Lesson
          </Button>
        </div>

        {/* Add lesson form */}
        {showLessonForm && (
          <Card>
            <CardHeader><CardTitle className="text-base">New Lesson</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={lessonForm.handleSubmit(onAddLesson)} className="space-y-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input {...lessonForm.register('title')} placeholder="e.g. Introduction" />
                  {lessonForm.formState.errors.title && (
                    <p className="text-sm text-red-500">{lessonForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Description (optional)</Label>
                  <Input {...lessonForm.register('description')} />
                </div>
                <div className="space-y-2">
                  <Label>Video (optional)</Label>
                  <Input type="file" accept="video/*" {...lessonForm.register('video')} />
                  <p className="text-xs text-muted-foreground">Leave empty to add video later</p>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={addingLesson}>
                    {addingLesson ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : 'Add Lesson'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowLessonForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lessons list */}
        {course.lessons?.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lessons yet.</p>
        ) : (
          <div className="space-y-2">
            {course.lessons?.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <span className="text-sm font-medium">{index + 1}. {lesson.title}</span>
                  {isValidUrl(lesson.videoUrl) && (
                    <div>
                      
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View current video
                      </a>
                    </div>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteLesson(lesson.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
