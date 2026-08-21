export interface ConversionTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputFormats: string[];
  outputFormats: string[];
  apiType: string; // 'images-to-pdf', 'csv-to-xlsx', etc.
  category: 'image' | 'document' | 'spreadsheet' | 'pdf' | 'audio' | 'video';
}

export const CONVERSION_TOOLS: ConversionTool[] = [
  {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    description: 'Combine multiple images into a single PDF',
    icon: '🖼️',
    inputFormats: ['JPG', 'PNG', 'GIF', 'WEBP'],
    outputFormats: ['PDF'],
    apiType: 'images-to-pdf',
    category: 'image',
  },
  {
    id: 'csv-to-xlsx',
    name: 'CSV to Excel',
    description: 'Convert CSV files to Excel spreadsheets',
    icon: '📊',
    inputFormats: ['CSV'],
    outputFormats: ['XLSX'],
    apiType: 'csv-to-xlsx',
    category: 'spreadsheet',
  },
  {
    id: 'csv-to-json',
    name: 'CSV to JSON',
    description: 'Convert CSV to JSON format',
    icon: '📋',
    inputFormats: ['CSV'],
    outputFormats: ['JSON'],
    apiType: 'csv-to-json',
    category: 'spreadsheet',
  },
  {
    id: 'office-to-pdf',
    name: 'Office to PDF',
    description: 'Convert Word, Excel, PowerPoint to PDF',
    icon: '📄',
    inputFormats: ['DOCX', 'XLSX', 'PPTX', 'ODT', 'ODS', 'ODP'],
    outputFormats: ['PDF'],
    apiType: 'office-to-pdf',
    category: 'document',
  },
  {
    id: 'pdf-merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one',
    icon: '📎',
    inputFormats: ['PDF'],
    outputFormats: ['PDF'],
    apiType: 'pdf-merge',
    category: 'pdf',
  },
  {
    id: 'pdf-split',
    name: 'Split PDF',
    description: 'Split PDF into individual pages',
    icon: '✂️',
    inputFormats: ['PDF'],
    outputFormats: ['PDF'],
    apiType: 'pdf-split',
    category: 'pdf',
  },
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size',
    icon: '🗜️',
    inputFormats: ['PDF'],
    outputFormats: ['PDF'],
    apiType: 'pdf-compress',
    category: 'pdf',
  },
];
