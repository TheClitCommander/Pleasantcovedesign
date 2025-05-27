import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, Calendar, Check, ExternalLink } from "lucide-react";
import type { Business } from "@shared/schema";

interface LeadCardProps {
  business: Business;
  isDragging?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function LeadCard({ business, isDragging, onDragStart, onDragEnd }: LeadCardProps) {
  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Recently";
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Recently";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getStageIcon = () => {
    switch (business.stage) {
      case "contacted":
        return <MessageCircle className="w-3 h-3" />;
      case "interested":
        return <Calendar className="w-3 h-3" />;
      case "sold":
        return <Check className="w-3 h-3" />;
      case "delivered":
        return <ExternalLink className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  const getStageStatus = () => {
    switch (business.stage) {
      case "contacted":
        return { text: "SMS sent", color: "text-blue-600" };
      case "interested":
        return { text: "Call scheduled", color: "text-yellow-600" };
      case "sold":
        return { text: "Payment received", color: "text-green-600" };
      case "delivered":
        return { text: "Live website", color: "text-green-600" };
      default:
        return { text: formatTimeAgo(business.createdAt), color: "text-gray-500" };
    }
  };

  const status = getStageStatus();

  return (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? "dragging" : ""
      }`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <h4 className="font-medium text-sm text-gray-900">{business.name}</h4>
      <p className="text-xs text-gray-600 mt-1">{business.city}, {business.state}</p>
      <p className="text-xs text-gray-500 mt-1">{business.phone}</p>
      
      {business.stage === "sold" && (
        <p className="text-xs text-green-600 font-medium mt-1">$400 + $50/mo</p>
      )}
      
      {business.stage === "delivered" && business.website && (
        <p className="text-xs text-green-600 font-medium mt-1">Live website</p>
      )}
      
      <div className="mt-2 flex justify-between items-center">
        <span className={`text-xs ${status.color}`}>{status.text}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-primary hover:text-blue-700">
          {getStageIcon()}
        </Button>
      </div>
    </div>
  );
}
