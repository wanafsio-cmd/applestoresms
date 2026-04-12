import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrboxSize = 250;

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      
      // Initialize scanner
      scannerRef.current = new Html5Qrcode("barcode-reader");

      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Success callback
          toast.success("Barcode scanned!");
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Error callback (we can ignore most scanning errors)
          // console.log("Scan error:", errorMessage);
        }
      );
    } catch (error: any) {
      console.error("Scanner error:", error);
      toast.error("Failed to start scanner. Please check camera permissions.");
      setIsScanning(false);
      onClose();
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      }
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        stopScanner();
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>
        
        <Card className="p-4">
          <div className="space-y-4">
            <div 
              id="barcode-reader" 
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: "300px" }}
            />
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Position the barcode within the frame
              </p>
              {isScanning && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Scanning...</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}