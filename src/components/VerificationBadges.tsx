import { Badge } from "@/components/ui/badge";
import { CheckCircle, Phone, CreditCard, Car, Shield } from "lucide-react";

interface VerificationBadgesProps {
  isPhoneVerified?: boolean;
  isCnicVerified?: boolean;
  isDriverVerified?: boolean;
  showLabels?: boolean;
  size?: "sm" | "md";
}

export const VerificationBadges = ({
  isPhoneVerified = false,
  isCnicVerified = false,
  isDriverVerified = false,
  showLabels = true,
  size = "md",
}: VerificationBadgesProps) => {
  const hasAnyVerification = isPhoneVerified || isCnicVerified || isDriverVerified;

  if (!hasAnyVerification) {
    return null;
  }

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const badgeSize = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <div className="flex flex-wrap gap-1.5">
      {isPhoneVerified && (
        <Badge 
          variant="outline" 
          className={`${badgeSize} bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800`}
        >
          <Phone className={`${iconSize} mr-1`} />
          {showLabels && "Phone"}
          <CheckCircle className={`${iconSize} ml-1`} />
        </Badge>
      )}
      {isCnicVerified && (
        <Badge 
          variant="outline" 
          className={`${badgeSize} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800`}
        >
          <CreditCard className={`${iconSize} mr-1`} />
          {showLabels && "CNIC"}
          <CheckCircle className={`${iconSize} ml-1`} />
        </Badge>
      )}
      {isDriverVerified && (
        <Badge 
          variant="outline" 
          className={`${badgeSize} bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800`}
        >
          <Car className={`${iconSize} mr-1`} />
          {showLabels && "Driver"}
          <CheckCircle className={`${iconSize} ml-1`} />
        </Badge>
      )}
    </div>
  );
};

// Compact version for displaying in ride cards
export const VerifiedBadge = ({ verified = false }: { verified?: boolean }) => {
  if (!verified) return null;

  return (
    <Badge 
      variant="outline" 
      className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
    >
      <Shield className="w-3 h-3 mr-1" />
      Verified
    </Badge>
  );
};

export default VerificationBadges;
