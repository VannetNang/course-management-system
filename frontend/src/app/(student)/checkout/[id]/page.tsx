'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

type PaymentStatus = 'idle' | 'loading' | 'pending' | 'success' | 'cancelled';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [qrString, setQrString] = useState<string | null>(null);
  const [enrolmentId, setEnrolmentId] = useState<string | null>(null);
  const [md5Hash, setMd5Hash] = useState<string | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    api.get(`/enrolments/summary/${id}`)
      .then((res) => {
        const finalAmount = res.data.data?.totalPrice ?? res.data.data?.originalPrice ?? 0;
        if (Number(finalAmount) === 0) setIsFree(true);
      })
      .catch(() => {})
      .finally(() => setLoadingPrice(false));
  }, [id]);

  const enrol = async () => {
    setStatus('loading');
    try {
      const res = await api.get(`/enrolments/checkout/${id}`);
      if (res.data.data.free) {
        setStatus('success');
        toast.success('Enrolled successfully!');
        setTimeout(() => router.push('/my-courses'), 2000);
        return;
      }
      setQrString(res.data.data.qr);
      setEnrolmentId(res.data.data.enrolmentId);
      setMd5Hash(res.data.data.md5);
      setStatus('pending');
      pollPayment(res.data.data.enrolmentId, res.data.data.md5);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enrol');
      setStatus('idle');
    }
  };

  const pollPayment = (eid: string, md5: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.post('/enrolments/checkout', { enrolmentId: eid, md5 });
        console.log(res);
        
        const paymentStatus = res.data.status;
        if (paymentStatus === 'success') {
          clearInterval(interval);
          setStatus('success');
          toast.success('Payment successful! Redirecting...');
          setTimeout(() => router.push('/my-courses'), 2000);
        } else if (paymentStatus === 'error' && res.data.message?.includes('cancelled')) {
          clearInterval(interval);
          setStatus('cancelled');
        }
      } catch(err) {
        console.log(err);
        
      }
    }, 3000);
    setTimeout(() => clearInterval(interval), 300000);
  };

  const cancelPayment = async () => {
    if (!enrolmentId) return;
    try {
      await api.patch(`/enrolments/checkout/${enrolmentId}`);
      setStatus('cancelled');
      toast.info('Payment cancelled');
    } catch {
      toast.error('Failed to cancel payment');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isFree ? 'Free Enrolment' : 'Checkout'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {loadingPrice ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {status === 'idle' && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {isFree
                      ? 'This course is free! Click below to enrol instantly.'
                      : 'Click below to generate your KHQR payment code.'}
                  </p>
                  <Button className="w-full" size="lg" onClick={enrol}>
                    {isFree ? 'Enrol Now' : 'Generate KHQR'}
                  </Button>
                </div>
              )}

              {status === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isFree ? 'Enrolling...' : 'Generating QR code...'}
                  </p>
                </div>
              )}

              {status === 'pending' && qrString && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                      Waiting for payment...
                    </Badge>
                  </div>
                  <div className="flex justify-center">
                    <QRCodeSVG value={qrString} size={256} />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Scan this QR code with your Bakong app to complete payment.
                  </p>
                  <Button variant="outline" className="w-full" onClick={cancelPayment}>
                    Cancel Payment
                  </Button>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <p className="font-semibold text-lg">
                    {isFree ? 'Enrolled Successfully!' : 'Payment Successful!'}
                  </p>
                  <p className="text-muted-foreground text-sm">Redirecting to your courses...</p>
                </div>
              )}

              {status === 'cancelled' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <XCircle className="w-12 h-12 text-red-500" />
                  <p className="font-semibold text-lg">Payment Cancelled</p>
                  <Button className="w-full" onClick={() => setStatus('idle')}>
                    Try Again
                  </Button>
                </div>
              )}
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
