import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileImage, 
  Settings, 
  History as HistoryIcon, 
  ChevronRight, 
  Download, 
  Maximize2, 
  Trash2, 
  Loader2, 
  Layers, 
  Box, 
  Eye,
  Sun,
  Moon,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeAndGenerateViews, OrthographicAnalysis } from "./lib/gemini";
import ReactMarkdown from "react-markdown";

interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage: string;
  generatedImage: string | null;
  analysis: OrthographicAnalysis;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const base64 = selectedImage.split(",")[1];
      const { analysis, generatedImageUrl } = await analyzeAndGenerateViews(base64, mimeType);

      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        originalImage: selectedImage,
        generatedImage: generatedImageUrl,
        analysis,
      };

      setCurrentResult(newItem);
      setHistory((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error("Failed to analyze image:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="border-bottom border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Box className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MechView AI</h1>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Mechanical Vision System v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar - History */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" />
              History
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{history.length}</Badge>
              {history.length > 0 && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setHistory([]); setCurrentResult(null); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground font-mono">NO RECORDS FOUND</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group cursor-pointer p-3 rounded-xl border transition-all hover:bg-accent ${currentResult?.id === item.id ? 'bg-accent border-primary' : 'border-border'}`}
                    onClick={() => setCurrentResult(item)}
                  >
                    <div className="flex gap-3">
                      <img src={item.originalImage} className="w-12 h-12 rounded-md object-cover border border-border" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{new Date(item.timestamp).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase truncate">Analysis Complete</p>
                      </div>
                      <ChevronRight className="w-4 h-4 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="overflow-hidden border-2">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Source Input
                </CardTitle>
                <CardDescription>Upload a 3D perspective image of the mechanical part</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div 
                  className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/50 ${selectedImage ? 'border-primary' : 'border-border'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <>
                      <img src={selectedImage} className="absolute inset-0 w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Click to upload or drag & drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP (Max 10MB)</p>
                      </div>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
                <Button 
                  className="w-full mt-6 h-12 text-lg font-bold" 
                  disabled={!selectedImage || isAnalyzing}
                  onClick={handleGenerate}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Geometry...
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5 mr-2" />
                      Generate Orthographic Views
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result Preview Section */}
            <Card className="overflow-hidden border-2">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Orthographic Output
                </CardTitle>
                <CardDescription>Generated three-view technical drawing</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="relative flex-1 aspect-square rounded-2xl bg-muted/30 border-2 border-border overflow-hidden flex items-center justify-center">
                  {isAnalyzing ? (
                    <div className="w-full h-full p-8 space-y-4">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                  ) : currentResult?.generatedImage ? (
                    <>
                      <img src={currentResult.generatedImage} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={() => downloadImage(currentResult.generatedImage!, `mechview-${currentResult.id}.png`)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Box className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <p className="text-sm text-muted-foreground">Generated views will appear here after analysis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Details */}
          <AnimatePresence mode="wait">
            {currentResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-2">
                  <Tabs defaultValue="analysis" className="w-full">
                    <CardHeader className="bg-muted/50 border-b pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          Technical Specifications
                        </CardTitle>
                        <Badge variant="outline" className="font-mono">ID: {currentResult.id}</Badge>
                      </div>
                      <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-bold">Analysis</TabsTrigger>
                        <TabsTrigger value="views" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-bold">View Descriptions</TabsTrigger>
                      </TabsList>
                    </CardHeader>
                    <CardContent className="p-6">
                      <TabsContent value="analysis" className="mt-0">
                        <div className="prose prose-sm dark:prose-invert max-w-none font-mono text-xs leading-relaxed">
                          <ReactMarkdown>{currentResult.analysis.technicalDetails}</ReactMarkdown>
                        </div>
                      </TabsContent>
                      <TabsContent value="views" className="mt-0 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Front View</h4>
                            <Separator />
                            <p className="text-sm text-muted-foreground leading-relaxed">{currentResult.analysis.frontView}</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Top View</h4>
                            <Separator />
                            <p className="text-sm text-muted-foreground leading-relaxed">{currentResult.analysis.topView}</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Side View</h4>
                            <Separator />
                            <p className="text-sm text-muted-foreground leading-relaxed">{currentResult.analysis.sideView}</p>
                          </div>
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">© 2026 MECHVIEW AI SYSTEMS. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">DOCUMENTATION</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">API ACCESS</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">SUPPORT</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
