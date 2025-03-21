import "./App.css";
import heic2any from "heic2any";
import { useCallback, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  ProgressBar,
  Row,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import {
  ArrowClockwise,
  Download,
  Github,
  Image,
  XCircle,
} from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

interface ConvertedImage {
  id: string;
  originalName: string;
  originalFile: File;
  convertedBlob?: Blob;
  convertedUrl?: string;
  isConverting: boolean;
  error?: string;
}

function App() {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">(
    "image/jpeg",
  );
  const [quality, setQuality] = useState<number>(0.8);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const processFiles = useCallback(
    async (files: File[]) => {
      const heicFiles = Array.from(files).filter(
        (file) =>
          file.name.toLowerCase().endsWith(".heic") ||
          file.type === "image/heic" ||
          file.type === "image/heif",
      );

      if (heicFiles.length === 0) {
        showToastNotification(
          "No HEIC/HEIF files found. Please upload HEIC images.",
        );
        return;
      }

      const newImages: ConvertedImage[] = heicFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalName: file.name,
        originalFile: file,
        isConverting: true,
      }));

      setImages((prev) => [...prev, ...newImages]);

      for (const image of newImages) {
        try {
          const blob = (await heic2any({
            blob: image.originalFile,
            toType: format,
            quality,
          })) as Blob;

          const url = URL.createObjectURL(blob);

          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? {
                    ...img,
                    convertedBlob: blob,
                    convertedUrl: url,
                    isConverting: false,
                  }
                : img,
            ),
          );
        } catch (error) {
          console.error("Conversion error:", error);
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? {
                    ...img,
                    isConverting: false,
                    error: "Failed to convert image",
                  }
                : img,
            ),
          );
        }
      }
    },
    [format, quality],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    },
    [processFiles],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(Array.from(e.target.files));
      }
    },
    [processFiles],
  );

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const updatedImages = prev.filter((img) => img.id !== id);
      // Revoke URLs to prevent memory leaks
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove?.convertedUrl) {
        URL.revokeObjectURL(imageToRemove.convertedUrl);
      }
      return updatedImages;
    });
  };

  const handleDownload = (image: ConvertedImage) => {
    if (!image.convertedBlob || !image.convertedUrl) return;

    const extension = format === "image/jpeg" ? "jpg" : "png";
    const fileName = image.originalName.replace(/\.heic$/i, `.${extension}`);

    const link = document.createElement("a");
    link.href = image.convertedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    const convertedImages = images.filter(
      (img) => img.convertedUrl && !img.isConverting && !img.error,
    );

    if (convertedImages.length === 0) {
      showToastNotification("No converted images to download");
      return;
    }

    convertedImages.forEach((image) => {
      handleDownload(image);
    });
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as "image/jpeg" | "image/png");
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuality(parseFloat(e.target.value));
  };

  const clearAll = () => {
    // Revoke URLs to prevent memory leaks
    images.forEach((img) => {
      if (img.convertedUrl) {
        URL.revokeObjectURL(img.convertedUrl);
      }
    });
    setImages([]);
  };

  const reconvertAll = () => {
    // Revoke URLs to prevent memory leaks
    images.forEach((img) => {
      if (img.convertedUrl) {
        URL.revokeObjectURL(img.convertedUrl);
      }
    });

    const originalFiles = images.map((img) => img.originalFile);
    setImages([]);
    processFiles(originalFiles);
  };

  return (
    <Container fluid className="heicu-app px-4">
      <header className="app-header text-center my-4">
        <h1 className="app-title">
          <img
            src="/android-chrome-192x192.png"
            alt="Heicu logo"
            className="me-2"
            style={{
              width: "32px",
              height: "32px",
              verticalAlign: "middle",
              transform: "translateY(-2px)",
            }}
          />
          HEICU
        </h1>
        <p className="app-subtitle">HEIC Image Converter Utility</p>
      </header>

      <main>
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={10} lg={8}>
            <Card className="drop-zone-card">
              <Card.Body>
                <Row>
                  <Col md={4} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label>Output Format</Form.Label>
                      <Form.Select value={format} onChange={handleFormatChange}>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Quality {quality * 100}%</Form.Label>
                      <Form.Range
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={quality}
                        onChange={handleQualityChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mb-4">
          <Col xs={12} md={10} lg={8}>
            <div
              className={`drop-zone ${isDragging ? "dragging" : ""}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".heic,.heif"
                multiple
                style={{ display: "none" }}
              />
              <div className="drop-zone-content">
                <Image size={48} className="mb-3" />
                <h3>Drop HEIC images here</h3>
                <p>or click to browse files</p>
              </div>
            </div>
          </Col>
        </Row>

        {images.length > 0 && (
          <Row className="justify-content-center mb-4">
            <Col xs={12} md={10} lg={8}>
              <Card className="images-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Images ({images.length})</h5>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={reconvertAll}
                      disabled={images.some((img) => img.isConverting)}
                    >
                      <ArrowClockwise className="me-1" /> Reconvert All
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={clearAll}
                    >
                      <XCircle className="me-1" /> Clear All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {images.map((image) => (
                    <Card key={image.id} className="mb-3 image-item">
                      <Card.Body>
                        <div className="d-flex">
                          {image.convertedUrl && !image.error ? (
                            <div className="image-preview">
                              <img
                                src={image.convertedUrl}
                                alt={image.originalName}
                              />
                            </div>
                          ) : (
                            <div className="image-placeholder">
                              <Image size={32} />
                            </div>
                          )}

                          <div className="image-info flex-grow-1 ms-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="mb-1">{image.originalName}</h6>
                              <Button
                                variant="link"
                                className="p-0 text-danger"
                                onClick={() => handleRemoveImage(image.id)}
                              >
                                <XCircle />
                              </Button>
                            </div>

                            {image.isConverting ? (
                              <div>
                                <small className="text-muted">
                                  Converting...
                                </small>
                                <ProgressBar
                                  animated
                                  now={100}
                                  className="mt-2"
                                  style={{ height: "6px" }}
                                />
                              </div>
                            ) : image.error ? (
                              <div className="text-danger">{image.error}</div>
                            ) : (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="mt-2"
                                onClick={() => handleDownload(image)}
                                disabled={!image.convertedUrl}
                              >
                                <Download className="me-1" /> Download{" "}
                                {format === "image/jpeg" ? "JPEG" : "PNG"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
                <Card.Footer>
                  <Button
                    variant="primary"
                    onClick={handleDownloadAll}
                    disabled={
                      !images.some(
                        (img) =>
                          img.convertedUrl && !img.isConverting && !img.error,
                      )
                    }
                  >
                    <Download className="me-1" /> Download All
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        )}
      </main>

      <footer className="app-footer text-center py-3 mt-auto">
        <p>
          Faiz Surani ·{" "}
          <a
            href="https://github.com/ProbablyFaiz/heicu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="github-icon" /> GitHub
          </a>
        </p>
      </footer>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">HEICU</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}

export default App;
