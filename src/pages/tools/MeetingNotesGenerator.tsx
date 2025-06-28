import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, Download, Plus, Trash2, Check, X } from 'lucide-react';
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
    startTime: '',
    endTime: '',
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
  const [template, setTemplate] = useState<'professional' | 'simple' | 'colorful'>('professional');
  const [previewMode, setPreviewMode] = useState(false);
  
  const notesRef = useRef<HTMLDivElement>(null);

  // Helper functions for managing participants
  const addParticipant = () => {
    setMeetingNotes(prev => ({
      ...prev,
      participants: [
        ...prev.participants,
        { id: Date.now().toString(), name: '', role: '' }
      ]
    }));
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setMeetingNotes(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const removeParticipant = (id: string) => {
    if (meetingNotes.participants.length > 1) {
      setMeetingNotes(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== id)
      }));
    }
  };

  // Helper functions for managing agenda items
  const addAgendaItem = () => {
    setMeetingNotes(prev => ({
      ...prev,
      agenda: [
        ...prev.agenda,
        { id: Date.now().toString(), title: '', description: '', duration: '', presenter: '' }
      ]
    }));
  };

  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: string) => {
    setMeetingNotes(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeAgendaItem = (id: string) => {
    if (meetingNotes.agenda.length > 1) {
      setMeetingNotes(prev => ({
        ...prev,
        agenda: prev.agenda.filter(item => item.id !== id)
      }));
    }
  };

  // Helper functions for managing decisions
  const addDecision = () => {
    setMeetingNotes(prev => ({
      ...prev,
      decisions: [
        ...prev.decisions,
        { id: Date.now().toString(), description: '' }
      ]
    }));
  };

  const updateDecision = (id: string, value: string) => {
    setMeetingNotes(prev => ({
      ...prev,
      decisions: prev.decisions.map(d => 
        d.id === id ? { ...d, description: value } : d
      )
    }));
  };

  const removeDecision = (id: string) => {
    if (meetingNotes.decisions.length > 1) {
      setMeetingNotes(prev => ({
        ...prev,
        decisions: prev.decisions.filter(d => d.id !== id)
      }));
    }
  };

  // Helper functions for managing action items
  const addActionItem = () => {
    setMeetingNotes(prev => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        { id: Date.now().toString(), description: '', assignee: '', dueDate: '', status: 'pending' }
      ]
    }));
  };

  const updateActionItem = (id: string, field: keyof ActionItem, value: string | ActionItem['status']) => {
    setMeetingNotes(prev => ({
      ...prev,
      actionItems: prev.actionItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeActionItem = (id: string) => {
    if (meetingNotes.actionItems.length > 1) {
      setMeetingNotes(prev => ({
        ...prev,
        actionItems: prev.actionItems.filter(item => item.id !== id)
      }));
    }
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
      
      let position = 0;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      
      // If the image is taller than the page, add more pages
      let heightLeft = imgHeight - pageHeight;
      
      while (heightLeft > 0) {
        position = -pageHeight; // Move to next page
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
  const exportToDOCX = async () => {
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
                text: meetingNotes.title || "Meeting Notes",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200,
                },
              }),
              
              // Meeting Info Table
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Date:")],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(meetingNotes.date)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Time:")],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(`${meetingNotes.startTime} - ${meetingNotes.endTime}`)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Location:")],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(meetingNotes.location)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Facilitator:")],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(meetingNotes.facilitator)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Note Taker:")],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(meetingNotes.notetaker)],
                      }),
                    ],
                  }),
                ],
              }),
              
              // Participants
              new Paragraph({
                text: "Participants",
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 50,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph({
                          text: "Name",
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 50,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph({
                          text: "Role",
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.participants.map(participant => 
                    new TableRow({
                      children: [
                        new TableCell({
                          width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                          },
                          children: [new Paragraph(participant.name)],
                        }),
                        new TableCell({
                          width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                          },
                          children: [new Paragraph(participant.role)],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              
              // Agenda
              new Paragraph({
                text: "Agenda",
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              
              ...meetingNotes.agenda.map((item, index) => [
                new Paragraph({
                  text: `${index + 1}. ${item.title}`,
                  heading: HeadingLevel.HEADING_3,
                  spacing: {
                    before: 200,
                    after: 100,
                  },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Duration: ",
                      bold: true,
                    }),
                    new TextRun(item.duration),
                    new TextRun({
                      text: " | Presenter: ",
                      bold: true,
                    }),
                    new TextRun(item.presenter),
                  ],
                  spacing: {
                    after: 100,
                  },
                }),
                new Paragraph({
                  text: item.description,
                  spacing: {
                    after: 200,
                  },
                }),
              ]).flat(),
              
              // Summary
              new Paragraph({
                text: "Meeting Summary",
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              
              new Paragraph({
                text: meetingNotes.summary,
                spacing: {
                  after: 200,
                },
              }),
              
              // Decisions
              new Paragraph({
                text: "Decisions",
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              
              ...meetingNotes.decisions.map((decision, index) => 
                new Paragraph({
                  text: `${index + 1}. ${decision.description}`,
                  bullet: {
                    level: 0,
                  },
                  spacing: {
                    after: 100,
                  },
                })
              ),
              
              // Action Items
              new Paragraph({
                text: "Action Items",
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 40,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph({
                          text: "Action Item",
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 25,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph({
                          text: "Assignee",
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 20,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph({
                          text: "Due Date",
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 15,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph({
                          text: "Status",
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: {
                          fill: "F2F2F2",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.actionItems.map(item => 
                    new TableRow({
                      children: [
                        new TableCell({
                          width: {
                            size: 40,
                            type: WidthType.PERCENTAGE,
                          },
                          children: [new Paragraph(item.description)],
                        }),
                        new TableCell({
                          width: {
                            size: 25,
                            type: WidthType.PERCENTAGE,
                          },
                          children: [new Paragraph(item.assignee)],
                        }),
                        new TableCell({
                          width: {
                            size: 20,
                            type: WidthType.PERCENTAGE,
                          },
                          children: [new Paragraph(item.dueDate)],
                        }),
                        new TableCell({
                          width: {
                            size: 15,
                            type: WidthType.PERCENTAGE,
                          },
                          children: [new Paragraph(
                            item.status === 'completed' ? "Completed" :
                            item.status === 'in-progress' ? "In Progress" : 
                            "Pending"
                          )],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              
              // Next Meeting
              new Paragraph({
                text: "Next Meeting",
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Date: ",
                    bold: true,
                  }),
                  new TextRun(meetingNotes.nextMeetingDate),
                ],
                spacing: {
                  after: 100,
                },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Location: ",
                    bold: true,
                  }),
                  new TextRun(meetingNotes.nextMeetingLocation),
                ],
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
  const exportNotes = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToDOCX();
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: ActionItem['status']): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  // Get template class
  const getTemplateClass = (): string => {
    switch (template) {
      case 'professional':
        return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white';
      case 'simple':
        return 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white';
      case 'colorful':
        return 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-gray-900 dark:text-white';
    }
  };

  return (
    <div className="min-h-screen py-8 bg-white dark:bg-gray-900">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Generator Notulen Rapat
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Buat notulen rapat terstruktur dengan action items dan format profesional.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 shadow-lg shadow-blue-500/10">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Fitur Generator Notulen:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Buat notulen rapat dengan format profesional</li>
            <li>Catat peserta, agenda, keputusan, dan action items</li>
            <li>Pilih template yang sesuai dengan kebutuhan Anda</li>
            <li>Ekspor ke PDF atau Word untuk dibagikan</li>
            <li>Simpan dan gunakan kembali template untuk rapat berikutnya</li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          {!previewMode && (
            <div className="lg:col-span-2 space-y-6">
              {/* Meeting Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Detail Rapat
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
                      placeholder="Contoh: Rapat Perencanaan Proyek Q3"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={meetingNotes.date}
                        onChange={(e) => updateMeetingNotes('date', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waktu Mulai
                      </label>
                      <input
                        type="time"
                        value={meetingNotes.startTime}
                        onChange={(e) => updateMeetingNotes('startTime', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      value={meetingNotes.location}
                      onChange={(e) => updateMeetingNotes('location', e.target.value)}
                      placeholder="Contoh: Ruang Rapat Utama atau Zoom Meeting"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fasilitator
                      </label>
                      <input
                        type="text"
                        value={meetingNotes.facilitator}
                        onChange={(e) => updateMeetingNotes('facilitator', e.target.value)}
                        placeholder="Nama fasilitator rapat"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        placeholder="Nama pembuat notulen"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Peserta Rapat
                  </h3>
                  <button
                    onClick={addParticipant}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center space-x-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                          placeholder="Nama peserta"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={participant.role}
                          onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                          placeholder="Jabatan/Peran"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        disabled={meetingNotes.participants.length === 1}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Agenda Rapat
                  </h3>
                  <button
                    onClick={addAgendaItem}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {meetingNotes.agenda.map((item, index) => (
                    <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Item #{index + 1}
                        </h4>
                        <button
                          onClick={() => removeAgendaItem(item.id)}
                          disabled={meetingNotes.agenda.length === 1}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateAgendaItem(item.id, 'title', e.target.value)}
                          placeholder="Judul agenda"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => updateAgendaItem(item.id, 'duration', e.target.value)}
                            placeholder="Durasi (contoh: 30 menit)"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={item.presenter}
                            onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                            placeholder="Presenter"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <textarea
                          value={item.description}
                          onChange={(e) => updateAgendaItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi agenda"
                          rows={2}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meeting Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ringkasan Rapat
                </h3>
                
                <textarea
                  value={meetingNotes.summary}
                  onChange={(e) => updateMeetingNotes('summary', e.target.value)}
                  placeholder="Ringkasan hasil rapat secara keseluruhan..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Decisions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Keputusan
                  </h3>
                  <button
                    onClick={addDecision}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {meetingNotes.decisions.map((decision, index) => (
                    <div key={decision.id} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={decision.description}
                          onChange={(e) => updateDecision(decision.id, e.target.value)}
                          placeholder={`Keputusan #${index + 1}`}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => removeDecision(decision.id)}
                        disabled={meetingNotes.decisions.length === 1}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Action Items
                  </h3>
                  <button
                    onClick={addActionItem}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {meetingNotes.actionItems.map((item, index) => (
                    <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Action Item #{index + 1}
                        </h4>
                        <button
                          onClick={() => removeActionItem(item.id)}
                          disabled={meetingNotes.actionItems.length === 1}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateActionItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi tugas"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={item.assignee}
                            onChange={(e) => updateActionItem(item.id, 'assignee', e.target.value)}
                            placeholder="Penanggung jawab"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateActionItem(item.id, 'dueDate', e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) => updateActionItem(item.id, 'status', e.target.value as ActionItem['status'])}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Meeting */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Rapat Berikutnya
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={meetingNotes.nextMeetingDate}
                      onChange={(e) => updateMeetingNotes('nextMeetingDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {previewMode && (
            <div className="lg:col-span-2">
              <div ref={notesRef} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg ${getTemplateClass()}`}>
                {/* Meeting Title */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">{meetingNotes.title || "Meeting Notes"}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {meetingNotes.date && new Date(meetingNotes.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {meetingNotes.startTime && meetingNotes.endTime && ` • ${meetingNotes.startTime} - ${meetingNotes.endTime}`}
                  </p>
                </div>
                
                {/* Meeting Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 shadow-sm">
                    <h2 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Informasi Rapat</h2>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-medium w-24">Lokasi:</span>
                        <span>{meetingNotes.location}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium w-24">Fasilitator:</span>
                        <span>{meetingNotes.facilitator}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium w-24">Notulis:</span>
                        <span>{meetingNotes.notetaker}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 shadow-sm">
                    <h2 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Peserta</h2>
                    <div className="space-y-1">
                      {meetingNotes.participants.map((participant, index) => (
                        <div key={participant.id} className="flex">
                          <span>{participant.name}</span>
                          {participant.role && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">({participant.role})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Agenda */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                    Agenda
                  </h2>
                  
                  {meetingNotes.agenda.map((item, index) => (
                    <div key={item.id} className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <h3 className="text-lg font-medium mb-2">{index + 1}. {item.title}</h3>
                      {(item.duration || item.presenter) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.duration && `Durasi: ${item.duration}`}
                          {item.duration && item.presenter && ' • '}
                          {item.presenter && `Presenter: ${item.presenter}`}
                        </p>
                      )}
                      {item.description && <p className="text-gray-700 dark:text-gray-300">{item.description}</p>}
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                {meetingNotes.summary && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                      Ringkasan Rapat
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{meetingNotes.summary}</p>
                  </div>
                )}
                
                {/* Decisions */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                    Keputusan
                  </h2>
                  
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    {meetingNotes.decisions.map((decision) => (
                      <li key={decision.id} className="text-gray-700 dark:text-gray-300">
                        {decision.description}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Action Items */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                    Action Items
                  </h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-600">
                            Action Item
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-600">
                            Penanggung Jawab
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-600">
                            Tenggat Waktu
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetingNotes.actionItems.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              {item.assignee}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              {item.dueDate && new Date(item.dueDate).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-sm border border-gray-200 dark:border-gray-600">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                                {item.status === 'completed' ? 'Completed' : 
                                 item.status === 'in-progress' ? 'In Progress' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Next Meeting */}
                {(meetingNotes.nextMeetingDate || meetingNotes.nextMeetingLocation) && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                      Rapat Berikutnya
                    </h2>
                    
                    <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 shadow-sm">
                      {meetingNotes.nextMeetingDate && (
                        <div className="flex mb-2">
                          <span className="font-medium w-24">Tanggal:</span>
                          <span>{new Date(meetingNotes.nextMeetingDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      )}
                      {meetingNotes.nextMeetingLocation && (
                        <div className="flex">
                          <span className="font-medium w-24">Lokasi:</span>
                          <span>{meetingNotes.nextMeetingLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings & Export */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Template
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={template === 'professional'}
                    onChange={() => setTemplate('professional')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Professional</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={template === 'simple'}
                    onChange={() => setTemplate('simple')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Simple</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={template === 'colorful'}
                    onChange={() => setTemplate('colorful')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Colorful</span>
                </label>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ekspor
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Format:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        exportFormat === 'pdf'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => setExportFormat('docx')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        exportFormat === 'docx'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Word (DOCX)
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>{previewMode ? 'Edit Notulen' : 'Preview Notulen'}</span>
                </button>
                
                <button
                  onClick={exportNotes}
                  disabled={isExporting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Mengekspor...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Unduh {exportFormat === 'pdf' ? 'PDF' : 'Word'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 shadow-lg shadow-blue-500/10">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Tips Notulen Efektif
              </h3>
              
              <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Catat semua keputusan penting dengan jelas</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Pastikan setiap action item memiliki penanggung jawab</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Tetapkan tenggat waktu yang jelas untuk setiap tugas</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Bagikan notulen segera setelah rapat selesai</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Terstruktur</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Format notulen yang terorganisir dan profesional
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Action Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lacak tugas dan tanggung jawab dengan jelas
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Format</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor ke PDF atau Word sesuai kebutuhan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;