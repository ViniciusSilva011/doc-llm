export function createPdfBuffer() {
  return Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf8");
}

export function createPdfFile(filename = "sample.pdf") {
  return new File([createPdfBuffer()], filename, {
    type: "application/pdf",
  });
}

export function createTextFile(filename = "sample.txt", content = "plain text") {
  return new File([Buffer.from(content, "utf8")], filename, {
    type: "text/plain",
  });
}
