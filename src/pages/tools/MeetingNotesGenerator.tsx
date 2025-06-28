import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, Download, Plus, Trash2, Check, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, UnderlineType, ShadingType } from 'docx';
import { saveAs } from 'file-saver';

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  presenter: string;
}

interface Decision {
  id: string;
  description: string;
}

interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface MeetingNotes {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  facilitator: string;
  notetaker: string;
  participants: Participant[];
  agenda: AgendaItem[];
  summary: string;
  decisions: Decision[];
  actionItems: ActionItem[];
  nextMeetingDate: string;
  nextMeetingLocation: string;
}

const MeetingNotesGenerator: React.FC = () => {
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotes>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    facilitator: '',
    notetaker: '',
    participants: [{ id: '1', name: '', role: '' }],
    agenda: [{ id: '1', title: '', description: '', duration: '', presenter: '' }],
    summary: '',
    decisions: [{ id: '1', description: '' }],
    actionItems: [{ id: '1', description: '', assignee: '', dueDate: '', status: 'pending' }],
    nextMeetingDate: '',
    nextMeetingLocation: ''
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [previewMode, setPreviewMode] = useState(false);
  
  const notesRef = useRef<HTMLDivElement>(null);

  // Helper functions for managing arrays of items
  const addItem = <T extends { id: string }>(
    array: T[],
    newItem: Omit<T, 'id'>,
    setFunction: React.Dispatch<React.SetStateAction<MeetingNotes>>
  ) => {
    const item = {
      ...newItem,
      id: Date.now().toString()
    } as T;
    
    setFunction(prev => ({
      ...prev,
      [array === meetingNotes.participants ? 'participants' :
       array === meetingNotes.agenda ? 'agenda' :
       array === meetingNotes.decisions ? 'decisions' : 'actionItems']: [...array, item]
    }));
  };

  const removeItem = <T extends { id: string }>(
    array: T[],
    id: string,
    setFunction: React.Dispatch<React.SetStateAction<MeetingNotes>>
  ) => {
    setFunction(prev => ({
      ...prev,
      [array === meetingNotes.participants ? 'participants' :
       array === meetingNotes.agenda ? 'agenda' :
       array === meetingNotes.decisions ? 'decisions' : 'actionItems']: array.filter(item => item.id !== id)
    }));
  };

  const updateItem = <T extends { id: string }>(
    array: T[],
    id: string,
    field: keyof Omit<T, 'id'>,
    value: any,
    setFunction: React.Dispatch<React.SetStateAction<MeetingNotes>>
  ) => {
    setFunction(prev => ({
      ...prev,
      [array === meetingNotes.participants ? 'participants' :
       array === meetingNotes.agenda ? 'agenda' :
       array === meetingNotes.decisions ? 'decisions' : 'actionItems']: array.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Specific helper functions
  const addParticipant = () => {
    addItem(meetingNotes.participants, { name: '', role: '' }, setMeetingNotes);
  };

  const addAgendaItem = () => {
    addItem(meetingNotes.agenda, { title: '', description: '', duration: '', presenter: '' }, setMeetingNotes);
  };

  const addDecision = () => {
    addItem(meetingNotes.decisions, { description: '' }, setMeetingNotes);
  };

  const addActionItem = () => {
    addItem(meetingNotes.actionItems, { description: '', assignee: '', dueDate: '', status: 'pending' }, setMeetingNotes);
  };

  // Update meeting notes
  const updateMeetingNotes = <K extends keyof MeetingNotes>(field: K, value: MeetingNotes[K]) => {
    setMeetingNotes(prev => ({ ...prev, [field]: value }));
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!notesRef.current) return;
    
    setIsExporting(true);
    
    try {
      const element = notesRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to maintain aspect ratio
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add new pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      pdf.save(`${meetingNotes.title || 'meeting-notes'}.pdf`);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Terjadi kesalahan saat mengekspor ke PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to DOCX
  const exportToDocx = async () => {
    setIsExporting(true);
    
    try {
      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: meetingNotes.title || 'Notulen Rapat',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200
                }
              }),
              
              // Meeting details
              new Paragraph({
                children: [
                  new TextRun({ text: 'Tanggal: ', bold: true }),
                  new TextRun(meetingNotes.date),
                  new TextRun({ text: ' | Waktu: ', bold: true }),
                  new TextRun(`${meetingNotes.startTime} - ${meetingNotes.endTime}`),
                ],
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: 'Lokasi: ', bold: true }),
                  new TextRun(meetingNotes.location),
                ],
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: 'Fasilitator: ', bold: true }),
                  new TextRun(meetingNotes.facilitator),
                  new TextRun({ text: ' | Notulis: ', bold: true }),
                  new TextRun(meetingNotes.notetaker),
                ],
                spacing: { after: 200 }
              }),
              
              // Participants
              new Paragraph({
                text: 'Peserta',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Nama')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Jabatan/Peran')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.participants.map(
                    participant => new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(participant.name)],
                        }),
                        new TableCell({
                          children: [new Paragraph(participant.role)],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              
              new Paragraph({
                text: '',
                spacing: { after: 200 }
              }),
              
              // Agenda
              new Paragraph({
                text: 'Agenda',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Topik')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Durasi')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Penyaji')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Deskripsi')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.agenda.map(
                    item => new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(item.title)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.duration)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.presenter)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.description)],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              
              new Paragraph({
                text: '',
                spacing: { after: 200 }
              }),
              
              // Summary
              new Paragraph({
                text: 'Ringkasan Rapat',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                text: meetingNotes.summary,
                spacing: { after: 200 }
              }),
              
              // Decisions
              new Paragraph({
                text: 'Keputusan',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              ...meetingNotes.decisions.map(
                (decision, index) => new Paragraph({
                  text: `${index + 1}. ${decision.description}`,
                  spacing: { after: 100 }
                })
              ),
              
              new Paragraph({
                text: '',
                spacing: { after: 100 }
              }),
              
              // Action Items
              new Paragraph({
                text: 'Action Items',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Tugas')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('PIC')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Deadline')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph('Status')],
                        shading: {
                          fill: "DDDDDD",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.actionItems.map(
                    item => new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(item.description)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.assignee)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.dueDate)],
                        }),
                        new TableCell({
                          children: [new Paragraph(
                            item.status === 'pending' ? 'Belum Dikerjakan' :
                            item.status === 'in-progress' ? 'Sedang Dikerjakan' : 'Selesai'
                          )],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              
              new Paragraph({
                text: '',
                spacing: { after: 200 }
              }),
              
              // Next Meeting
              new Paragraph({
                text: 'Rapat Berikutnya',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: 'Tanggal: ', bold: true }),
                  new TextRun(meetingNotes.nextMeetingDate || 'Belum ditentukan'),
                ],
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: 'Lokasi: ', bold: true }),
                  new TextRun(meetingNotes.nextMeetingLocation || 'Belum ditentukan'),
                ],
                spacing: { after: 100 }
              }),
            ],
          },
        ],
      });
      
      // Generate and save document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${meetingNotes.title || 'meeting-notes'}.docx`);
      
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      alert('Terjadi kesalahan saat mengekspor ke DOCX. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export based on selected format
  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToDocx();
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Generator Notulen Rapat
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Buat notulen rapat terstruktur dengan action items.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Fitur Notulen Rapat:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Template profesional untuk notulen rapat</li>
            <li>Daftar peserta dengan peran masing-masing</li>
            <li>Agenda rapat dengan durasi dan penyaji</li>
            <li>Keputusan dan action items dengan PIC dan deadline</li>
            <li>Ekspor ke PDF atau Word untuk distribusi mudah</li>
          </ul>
        </div>

        {/* Toggle Preview/Edit Mode */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-md">
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                !previewMode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                previewMode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {previewMode ? (
          /* Preview Mode */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
            <div ref={notesRef} className="max-w-4xl mx-auto">
              {/* Meeting Notes Preview */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {meetingNotes.title || 'Notulen Rapat'}
                </h1>
                <div className="text-gray-600 dark:text-gray-400">
                  <p>{formatDate(meetingNotes.date)}</p>
                  <p>{meetingNotes.startTime} - {meetingNotes.endTime}</p>
                  <p>{meetingNotes.location}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Fasilitator:</span> {meetingNotes.facilitator}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Notulis:</span> {meetingNotes.notetaker}
                  </div>
                </div>
              </div>
              
              {/* Participants */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Peserta
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Nama
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Jabatan/Peran
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {meetingNotes.participants.map((participant) => (
                        <tr key={participant.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {participant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {participant.role}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Agenda */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Agenda
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Topik
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Durasi
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Penyaji
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Deskripsi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {meetingNotes.agenda.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {item.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.duration}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.presenter}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Ringkasan Rapat
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {meetingNotes.summary}
                  </p>
                </div>
              </div>
              
              {/* Decisions */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Keputusan
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {meetingNotes.decisions.map((decision) => (
                    <li key={decision.id}>{decision.description}</li>
                  ))}
                </ul>
              </div>
              
              {/* Action Items */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Action Items
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tugas
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          PIC
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Deadline
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {meetingNotes.actionItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.assignee}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                : item.status === 'in-progress'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {item.status === 'pending' ? 'Belum Dikerjakan' :
                               item.status === 'in-progress' ? 'Sedang Dikerjakan' : 'Selesai'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Next Meeting */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Rapat Berikutnya
                </h2>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><span className="font-semibold">Tanggal:</span> {meetingNotes.nextMeetingDate ? formatDate(meetingNotes.nextMeetingDate) : 'Belum ditentukan'}</p>
                  <p><span className="font-semibold">Lokasi:</span> {meetingNotes.nextMeetingLocation || 'Belum ditentukan'}</p>
                </div>
              </div>
            </div>
            
            {/* Export Controls */}
            <div className="flex justify-center mt-8 space-x-4">
              <div className="flex items-center space-x-2 mr-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Format:
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'docx')}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word (DOCX)</option>
                </select>
              </div>
              
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Unduh {exportFormat.toUpperCase()}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setPreviewMode(false)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Meeting Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi Dasar
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Judul Rapat
                    </label>
                    <input
                      type="text"
                      value={meetingNotes.title}
                      onChange={(e) => updateMeetingNotes('title', e.target.value)}
                      placeholder="Contoh: Rapat Koordinasi Mingguan"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={meetingNotes.date}
                        onChange={(e) => updateMeetingNotes('date', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lokasi
                      </label>
                      <input
                        type="text"
                        value={meetingNotes.location}
                        onChange={(e) => updateMeetingNotes('location', e.target.value)}
                        placeholder="Contoh: Ruang Rapat Utama"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waktu Mulai
                      </label>
                      <input
                        type="time"
                        value={meetingNotes.startTime}
                        onChange={(e) => updateMeetingNotes('startTime', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waktu Selesai
                      </label>
                      <input
                        type="time"
                        value={meetingNotes.endTime}
                        onChange={(e) => updateMeetingNotes('endTime', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fasilitator
                      </label>
                      <input
                        type="text"
                        value={meetingNotes.facilitator}
                        onChange={(e) => updateMeetingNotes('facilitator', e.target.value)}
                        placeholder="Nama fasilitator/pemimpin rapat"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notulis
                      </label>
                      <input
                        type="text"
                        value={meetingNotes.notetaker}
                        onChange={(e) => updateMeetingNotes('notetaker', e.target.value)}
                        placeholder="Nama pencatat notulen"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Peserta
                  </h3>
                  <button
                    onClick={addParticipant}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {meetingNotes.participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center space-x-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateItem(meetingNotes.participants, participant.id, 'name', e.target.value, setMeetingNotes)}
                          placeholder="Nama"
                          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={participant.role}
                          onChange={(e) => updateItem(meetingNotes.participants, participant.id, 'role', e.target.value, setMeetingNotes)}
                          placeholder="Jabatan/Peran"
                          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(meetingNotes.participants, participant.id, setMeetingNotes)}
                        disabled={meetingNotes.participants.length <= 1}
                        className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Agenda
                  </h3>
                  <button
                    onClick={addAgendaItem}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.agenda.map((item) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Item Agenda
                        </h4>
                        <button
                          onClick={() => removeItem(meetingNotes.agenda, item.id, setMeetingNotes)}
                          disabled={meetingNotes.agenda.length <= 1}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(meetingNotes.agenda, item.id, 'title', e.target.value, setMeetingNotes)}
                          placeholder="Topik"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => updateItem(meetingNotes.agenda, item.id, 'duration', e.target.value, setMeetingNotes)}
                            placeholder="Durasi (contoh: 30 menit)"
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <input
                            type="text"
                            value={item.presenter}
                            onChange={(e) => updateItem(meetingNotes.agenda, item.id, 'presenter', e.target.value, setMeetingNotes)}
                            placeholder="Penyaji"
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(meetingNotes.agenda, item.id, 'description', e.target.value, setMeetingNotes)}
                          placeholder="Deskripsi"
                          rows={2}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ringkasan Rapat
                </h3>
                
                <textarea
                  value={meetingNotes.summary}
                  onChange={(e) => updateMeetingNotes('summary', e.target.value)}
                  placeholder="Masukkan ringkasan hasil rapat..."
                  rows={6}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Decisions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Keputusan
                  </h3>
                  <button
                    onClick={addDecision}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {meetingNotes.decisions.map((decision) => (
                    <div key={decision.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={decision.description}
                        onChange={(e) => updateItem(meetingNotes.decisions, decision.id, 'description', e.target.value, setMeetingNotes)}
                        placeholder="Keputusan yang diambil"
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <button
                        onClick={() => removeItem(meetingNotes.decisions, decision.id, setMeetingNotes)}
                        disabled={meetingNotes.decisions.length <= 1}
                        className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Action Items
                  </h3>
                  <button
                    onClick={addActionItem}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.actionItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Action Item
                        </h4>
                        <button
                          onClick={() => removeItem(meetingNotes.actionItems, item.id, setMeetingNotes)}
                          disabled={meetingNotes.actionItems.length <= 1}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(meetingNotes.actionItems, item.id, 'description', e.target.value, setMeetingNotes)}
                          placeholder="Deskripsi tugas"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.assignee}
                            onChange={(e) => updateItem(meetingNotes.actionItems, item.id, 'assignee', e.target.value, setMeetingNotes)}
                            placeholder="PIC"
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateItem(meetingNotes.actionItems, item.id, 'dueDate', e.target.value, setMeetingNotes)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <select
                          value={item.status}
                          onChange={(e) => updateItem(meetingNotes.actionItems, item.id, 'status', e.target.value as 'pending' | 'in-progress' | 'completed', setMeetingNotes)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="pending">Belum Dikerjakan</option>
                          <option value="in-progress">Sedang Dikerjakan</option>
                          <option value="completed">Selesai</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Meeting */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Rapat Berikutnya
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={meetingNotes.nextMeetingDate}
                      onChange={(e) => updateMeetingNotes('nextMeetingDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      value={meetingNotes.nextMeetingLocation}
                      onChange={(e) => updateMeetingNotes('nextMeetingLocation', e.target.value)}
                      placeholder="Lokasi rapat berikutnya"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => setPreviewMode(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Eye className="w-5 h-5" />
                <span>Preview & Ekspor</span>
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Template Profesional</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Format standar untuk notulen rapat yang profesional
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Action Items</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lacak tugas dan tanggung jawab dengan jelas
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Format</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor ke PDF atau Word untuk distribusi mudah
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;