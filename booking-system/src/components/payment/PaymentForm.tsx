"use client";

import { useState, useEffect } from "react";
import { loadStripe, Stripe as StripeJS } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Cargar Stripe fuera del componente para evitar recrearlo
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PaymentFormProps {
  appointmentId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({
  appointmentId,
  amount,
  currency,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createIntent() {
      try {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al inicializar el pago");
        }

        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError((err as Error).message);
        toast.error("Error al inicializar el pago");
      } finally {
        setLoading(false);
      }
    }

    createIntent();
  }, [appointmentId]);

  if (!stripePromise) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200">
        <AlertCircle className="h-4 w-4 inline mr-2" />
        Stripe no está configurado. Los pagos están deshabilitados.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
        {error}
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0ea5e9",
          },
        },
      }}
    >
      <CheckoutForm
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

function CheckoutForm({
  amount,
  currency,
  onSuccess,
  onCancel,
}: {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/client`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Error al procesar el pago");
      setIsProcessing(false);
      toast.error(submitError.message || "Error al procesar el pago");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast.success("¡Pago realizado con éxito!");
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total a pagar</span>
          </div>
          <span className="text-2xl font-bold">{formattedAmount}</span>
        </div>
      </div>

      <PaymentElement />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Pago seguro procesado por Stripe
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>Pagar {formattedAmount}</>
          )}
        </Button>
      </div>
    </form>
  );
}
