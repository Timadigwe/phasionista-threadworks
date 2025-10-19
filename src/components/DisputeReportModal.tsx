import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { escrowService } from "@/services/escrowService";
import { toast } from "sonner";

interface DisputeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderDetails?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    cloth_name?: string;
    designer_name?: string;
  };
}

export const DisputeReportModal = ({ isOpen, onClose, orderId, orderDetails }: DisputeReportModalProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disputeReasons = [
    { value: "delivery_issue", label: "Delivery Issue - Item not received" },
    { value: "wrong_item", label: "Wrong Item - Received different item" },
    { value: "damaged_item", label: "Damaged Item - Item arrived damaged" },
    { value: "quality_issue", label: "Quality Issue - Item doesn't match description" },
    { value: "size_issue", label: "Size Issue - Item doesn't fit" },
    { value: "designer_unresponsive", label: "Designer Unresponsive - No communication" },
    { value: "other", label: "Other Issue" }
  ];

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      toast.error("Please provide both reason and description");
      return;
    }

    try {
      setIsSubmitting(true);
      
      await escrowService.createDispute({
        order_id: orderId,
        customer_id: "", // Will be filled by the service
        reason,
        description: description.trim(),
        status: "open"
      });

      toast.success("Dispute reported successfully. Admin will review and get back to you.");
      onClose();
      
      // Reset form
      setReason("");
      setDescription("");
    } catch (error: any) {
      console.error("Error reporting dispute:", error);
      toast.error("Failed to report dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReason("");
      setDescription("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Report Delivery Issue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Details */}
          {orderDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Order ID:</span>
                    <p className="text-muted-foreground">{orderDetails.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p className="text-muted-foreground">
                      {orderDetails.amount} {orderDetails.currency}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-muted-foreground">{orderDetails.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Item:</span>
                    <p className="text-muted-foreground">{orderDetails.cloth_name || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dispute Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Issue Type *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of issue" />
                </SelectTrigger>
                <SelectContent>
                  {disputeReasons.map((reasonOption) => (
                    <SelectItem key={reasonOption.value} value={reasonOption.value}>
                      {reasonOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about the issue. Include any relevant details that will help us resolve this quickly."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Be as specific as possible. Include dates, times, and any communication you've had.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason || !description.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Report Issue
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
