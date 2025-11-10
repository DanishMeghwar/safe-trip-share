import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FareBreakdown } from "@/lib/fareCalculator";
import { DollarSign, Fuel, Wrench, TrendingUp } from "lucide-react";

interface FareBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: FareBreakdown;
}

export const FareBreakdownDialog = ({
  open,
  onOpenChange,
  breakdown,
}: FareBreakdownDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fare Breakdown</DialogTitle>
          <DialogDescription>
            See how the fare is calculated for this {breakdown.distanceKm} km trip
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-primary" />
                <span className="text-sm">Fuel Cost</span>
              </div>
              <span className="font-medium">PKR {breakdown.fuelCost}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span className="text-sm">Maintenance & Wear</span>
              </div>
              <span className="font-medium">PKR {breakdown.maintenanceCost}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm">Driver Profit</span>
              </div>
              <span className="font-medium">PKR {breakdown.driverProfit}</span>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-semibold">Your Share</span>
              </div>
              <span className="text-xl font-bold text-primary">PKR {breakdown.farePerSeat}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Trip costs are shared fairly among all passengers
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
