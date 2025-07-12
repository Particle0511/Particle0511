import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onImagesChange: (images: string[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
}

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

export default function UploadZone({ 
  onImagesChange, 
  maxFiles = 5, 
  accept = "image/*",
  className 
}: UploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return "Please select an image file";
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return "File size must be less than 5MB";
    }

    // Check if we're at the limit
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const simulateUpload = (id: string): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, uploading: false, progress: 100 } : f
          ));
          
          // Simulate getting back a URL - in real implementation this would come from your upload service
          const mockUrl = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=400&fit=crop`;
          resolve(mockUrl);
        } else {
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, progress } : f
          ));
        }
      }, 100);
    });
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileWithPreview[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      if (error) {
        toast({
          title: "Upload Error",
          description: error,
          variant: "destructive",
        });
        continue;
      }

      const id = `${Date.now()}-${i}`;
      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        file,
        preview,
        id,
        uploading: true,
        progress: 0,
      });
    }

    if (newFiles.length === 0) return;

    // Add files to state
    setFiles(prev => [...prev, ...newFiles]);

    // Start uploads
    const uploadPromises = newFiles.map(async (fileData) => {
      try {
        const url = await simulateUpload(fileData.id);
        return url;
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, uploading: false, error: "Upload failed" } : f
        ));
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter(url => url !== null) as string[];
    
    // Update parent component with all uploaded URLs
    const allUrls = files
      .filter(f => !f.uploading && !f.error)
      .map(f => f.preview) // In real implementation, this would be the uploaded URL
      .concat(validUrls);
    
    onImagesChange(allUrls);
  }, [files, maxFiles, onImagesChange, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const validUrls = updated
        .filter(f => !f.uploading && !f.error)
        .map(f => f.preview); // In real implementation, this would be the uploaded URL
      onImagesChange(validUrls);
      return updated;
    });
  }, [onImagesChange]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <Card className={cn(
        "border-2 border-dashed transition-all duration-200 cursor-pointer",
        dragActive 
          ? "border-eco-green bg-eco-green/5" 
          : "border-slate-300 hover:border-eco-green hover:bg-eco-green/5"
      )}>
        <CardContent 
          className="p-8 text-center"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
          
          <CloudUpload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">
            Drop your images here or click to browse
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Upload up to {maxFiles} photos (JPG, PNG, max 5MB each)
          </p>
          <Button 
            type="button" 
            className="bg-eco-green hover:bg-eco-green/90"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            Choose Files
          </Button>
        </CardContent>
      </Card>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {files.map((fileData) => (
            <Card key={fileData.id} className="relative overflow-hidden">
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <img
                    src={fileData.preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeFile(fileData.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Upload progress overlay */}
                  {fileData.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs">{Math.round(fileData.progress)}%</p>
                      </div>
                    </div>
                  )}

                  {/* Error overlay */}
                  {fileData.error && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                      <div className="text-white text-center">
                        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">{fileData.error}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File name */}
                <p className="text-xs text-slate-600 mt-2 truncate">
                  {fileData.file.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload summary */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {files.length} of {maxFiles} files uploaded
          </span>
          <div className="flex items-center space-x-2">
            {files.some(f => f.uploading) && (
              <Badge variant="secondary">
                Uploading...
              </Badge>
            )}
            {files.some(f => f.error) && (
              <Badge variant="destructive">
                {files.filter(f => f.error).length} failed
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
