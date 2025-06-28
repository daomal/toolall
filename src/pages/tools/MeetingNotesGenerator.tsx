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
  
  const notesRef = useRef<HTMLDivElement>(null);

  // Update meeting notes
  const updateMeetingNotes = <K extends keyof MeetingNotes>(key: K, value: MeetingNotes[K]) => {
    setMeetingNotes(prev => ({ ...prev, [key]: value }));
  };

  // Add participant
  const addParticipant = () => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: '',
      role: ''
    };
    updateMeetingNotes('participants', [...meetingNotes.participants, newParticipant]);
  };

  // Remove participant
  const removeParticipant = (id: string) => {
    if (meetingNotes.participants.length <= 1) return;
    updateMeetingNotes('participants', meetingNotes.participants.filter(p => p.id !== id));
  };

  // Update participant
  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    updateMeetingNotes(
      'participants',
      meetingNotes.participants.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Add agenda item
  const addAgendaItem = () => {
    const newAgendaItem: AgendaItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: '',
      presenter: ''
    };
    updateMeetingNotes('agenda', [...meetingNotes.agenda, newAgendaItem]);
  };

  // Remove agenda item
  const removeAgendaItem = (id: string) => {
    if (meetingNotes.agenda.length <= 1) return;
    updateMeetingNotes('agenda', meetingNotes.agenda.filter(a => a.id !== id));
  };

  // Update agenda item
  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: string) => {
    updateMeetingNotes(
      'agenda',
      meetingNotes.agenda.map(a => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // Add decision
  const addDecision = () => {
    const newDecision: Decision = {
      id: Date.now().toString(),
      description: ''
    };
    updateMeetingNotes('decisions', [...meetingNotes.decisions, newDecision]);
  };

  // Remove decision
  const removeDecision = (id: string) => {
    if (meetingNotes.decisions.length <= 1) return;
    updateMeetingNotes('decisions', meetingNotes.decisions.filter(d => d.id !== id));
  };

  // Update decision
  const updateDecision = (id: string, description: string) => {
    updateMeetingNotes(
      'decisions',
      meetingNotes.decisions.map(d => (d.id === id ? { ...d, description } : d))
    );
  };

  // Add action item
  const addActionItem = () => {
    const newActionItem: ActionItem = {
      id: Date.now().toString(),
      description: '',
      assignee: '',
      dueDate: '',
      status: 'pending'
    };
    updateMeetingNotes('actionItems', [...meetingNotes.actionItems, newActionItem]);
  };

  // Remove action item
  const removeActionItem = (id: string) => {
    if (meetingNotes.actionItems.length <= 1) return;
    updateMeetingNotes('actionItems', meetingNotes.actionItems.filter(a => a.id !== id));
  };

  // Update action item
  const updateActionItem = (id: string, field: keyof ActionItem, value: any) => {
    updateMeetingNotes(
      'actionItems',
      meetingNotes.actionItems.map(a => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // Format date
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

  // Export to PDF
  const exportToPDF = async () => {
    if (!notesRef.current || !meetingNotes.title) {
      alert('Harap isi judul rapat terlebih dahulu!');
      return;
    }

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
      pdf.save(`${meetingNotes.title.replace(/\s+/g, '_')}_notulen.pdf`);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Terjadi kesalahan saat mengekspor ke PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to DOCX
  const exportToDOCX = async () => {
    if (!meetingNotes.title) {
      alert('Harap isi judul rapat terlebih dahulu!');
      return;
    }

    setIsExporting(true);
    
    try {
      // Create document
      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 28,
                bold: true,
                color: "2E74B5",
              },
              paragraph: {
                spacing: {
                  after: 120,
                },
              },
            },
            {
              id: "Heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 26,
                bold: true,
                color: "2E74B5",
              },
              paragraph: {
                spacing: {
                  before: 240,
                  after: 120,
                },
              },
            },
            {
              id: "TableHeader",
              name: "Table Header",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                bold: true,
                color: "FFFFFF",
              },
            },
          ],
        },
      });

      // Title
      doc.addSection({
        properties: {},
        children: [
          new Paragraph({
            text: meetingNotes.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          
          // Meeting details
          new Paragraph({
            children: [
              new TextRun({ text: "Tanggal: ", bold: true }),
              new TextRun(formatDate(meetingNotes.date)),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Waktu: ", bold: true }),
              new TextRun(`${meetingNotes.startTime} - ${meetingNotes.endTime}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Lokasi: ", bold: true }),
              new TextRun(meetingNotes.location),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Fasilitator: ", bold: true }),
              new TextRun(meetingNotes.facilitator),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Notulis: ", bold: true }),
              new TextRun(meetingNotes.notetaker),
            ],
          }),
          
          // Participants
          new Paragraph({
            text: "Peserta",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
        ],
      });

      // Participants table
      const participantsTableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              width: {
                size: 50,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Nama", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 50,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Jabatan/Peran", style: "TableHeader" })],
            }),
          ],
        }),
        ...meetingNotes.participants
          .filter(p => p.name.trim())
          .map(
            (participant) =>
              new TableRow({
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
      ];

      const participantsTable = new Table({
        rows: participantsTableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
        },
      });

      doc.addSection({
        children: [
          participantsTable,
          
          // Agenda
          new Paragraph({
            text: "Agenda",
            heading: HeadingLevel.HEADING_2,
          }),
        ],
      });

      // Agenda table
      const agendaTableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              width: {
                size: 40,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Topik", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 30,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Presenter", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 15,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Durasi", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 15,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Deskripsi", style: "TableHeader" })],
            }),
          ],
        }),
        ...meetingNotes.agenda
          .filter(a => a.title.trim())
          .map(
            (item) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(item.title)],
                  }),
                  new TableCell({
                    children: [new Paragraph(item.presenter)],
                  }),
                  new TableCell({
                    children: [new Paragraph(item.duration)],
                  }),
                  new TableCell({
                    children: [new Paragraph(item.description)],
                  }),
                ],
              })
          ),
      ];

      const agendaTable = new Table({
        rows: agendaTableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
        },
      });

      doc.addSection({
        children: [
          agendaTable,
          
          // Summary
          new Paragraph({
            text: "Ringkasan Rapat",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph(meetingNotes.summary),
          
          // Decisions
          new Paragraph({
            text: "Keputusan",
            heading: HeadingLevel.HEADING_2,
          }),
        ],
      });

      // Decisions list
      const decisionsChildren = meetingNotes.decisions
        .filter(d => d.description.trim())
        .map(
          (decision, index) =>
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. `, bold: true }),
                new TextRun(decision.description),
              ],
              spacing: {
                before: 100,
                after: 100,
              },
            })
        );

      doc.addSection({
        children: [
          ...decisionsChildren,
          
          // Action Items
          new Paragraph({
            text: "Action Items",
            heading: HeadingLevel.HEADING_2,
          }),
        ],
      });

      // Action Items table
      const actionItemsTableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              width: {
                size: 40,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Tugas", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Penanggung Jawab", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 20,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Tenggat Waktu", style: "TableHeader" })],
            }),
            new TableCell({
              width: {
                size: 15,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                fill: "2E74B5",
                type: ShadingType.CLEAR,
              },
              children: [new Paragraph({ text: "Status", style: "TableHeader" })],
            }),
          ],
        }),
        ...meetingNotes.actionItems
          .filter(a => a.description.trim())
          .map(
            (item) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(item.description)],
                  }),
                  new TableCell({
                    children: [new Paragraph(item.assignee)],
                  }),
                  new TableCell({
                    children: [new Paragraph(item.dueDate ? formatDate(item.dueDate) : '')],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.status === 'pending' ? 'Belum Dimulai' : 
                                  item.status === 'in-progress' ? 'Dalam Proses' : 'Selesai',
                            color: item.status === 'pending' ? 'C00000' : 
                                  item.status === 'in-progress' ? 'ED7D31' : '70AD47',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
          ),
      ];

      const actionItemsTable = new Table({
        rows: actionItemsTableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
        },
      });

      doc.addSection({
        children: [
          actionItemsTable,
          
          // Next Meeting
          new Paragraph({
            text: "Rapat Berikutnya",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tanggal: ", bold: true }),
              new TextRun(meetingNotes.nextMeetingDate ? formatDate(meetingNotes.nextMeetingDate) : 'Belum ditentukan'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Lokasi: ", bold: true }),
              new TextRun(meetingNotes.nextMeetingLocation || 'Belum ditentukan'),
            ],
          }),
          
          // Footer
          new Paragraph({
            text: `Notulen dibuat pada ${new Date().toLocaleDateString('id-ID')}`,
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 500,
            },
          }),
        ],
      });

      // Generate and save document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${meetingNotes.title.replace(/\s+/g, '_')}_notulen.docx`);
      
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      alert('Terjadi kesalahan saat mengekspor ke DOCX. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export notes
  const exportNotes = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToDOCX();
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get template class
  const getTemplateClass = (): string => {
    switch (template) {
      case 'professional':
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'simple':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'colorful':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 border-blue-200 dark:border-indigo-800';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  // Get header class
  const getHeaderClass = (): string => {
    switch (template) {
      case 'professional':
        return 'border-b-2 border-blue-600 dark:border-blue-500 pb-2';
      case 'simple':
        return 'border-b border-gray-200 dark:border-gray-700 pb-2';
      case 'colorful':
        return 'bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-t-lg';
      default:
        return 'border-b-2 border-blue-600 dark:border-blue-500 pb-2';
    }
  };

  // Get section class
  const getSectionClass = (): string => {
    switch (template) {
      case 'professional':
        return 'border-b border-gray-200 dark:border-gray-700 pb-4 mb-4';
      case 'simple':
        return 'pb-4 mb-4';
      case 'colorful':
        return 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm mb-4';
      default:
        return 'border-b border-gray-200 dark:border-gray-700 pb-4 mb-4';
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
            Buat notulen rapat terstruktur dengan action items.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 shadow-lg shadow-blue-500/10">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Fitur Generator Notulen:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Buat notulen rapat profesional dengan format standar</li>
            <li>Catat peserta, agenda, keputusan, dan action items</li>
            <li>Ekspor ke PDF atau Word untuk dibagikan</li>
            <li>Pilih template yang sesuai dengan kebutuhan Anda</li>
            <li>Lacak status action items untuk follow-up</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Meeting Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detail Rapat
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Judul Rapat *
                  </label>
                  <input
                    type="text"
                    value={meetingNotes.title}
                    onChange={(e) => updateMeetingNotes('title', e.target.value)}
                    placeholder="Contoh: Rapat Perencanaan Proyek Q3"
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
                      placeholder="Nama fasilitator rapat"
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
                      placeholder="Nama pembuat notulen"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md shadow-blue-500/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {meetingNotes.participants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center space-x-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={participant.name}
                        onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                        placeholder="Nama peserta"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <input
                        type="text"
                        value={participant.role}
                        onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                        placeholder="Jabatan/Peran"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    <button
                      onClick={() => removeParticipant(participant.id)}
                      disabled={meetingNotes.participants.length <= 1}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md shadow-blue-500/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {meetingNotes.agenda.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Item #{index + 1}
                      </span>
                      <button
                        onClick={() => removeAgendaItem(item.id)}
                        disabled={meetingNotes.agenda.length <= 1}
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
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.presenter}
                          onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                          placeholder="Presenter"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => updateAgendaItem(item.id, 'duration', e.target.value)}
                          placeholder="Durasi (contoh: 30 menit)"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      
                      <textarea
                        value={item.description}
                        onChange={(e) => updateAgendaItem(item.id, 'description', e.target.value)}
                        placeholder="Deskripsi singkat (opsional)"
                        rows={2}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ringkasan Rapat
              </h3>
              
              <textarea
                value={meetingNotes.summary}
                onChange={(e) => updateMeetingNotes('summary', e.target.value)}
                placeholder="Ringkasan pembahasan dan poin-poin penting rapat..."
                rows={5}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md shadow-blue-500/30"
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
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    <button
                      onClick={() => removeDecision(decision.id)}
                      disabled={meetingNotes.decisions.length <= 1}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md shadow-blue-500/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {meetingNotes.actionItems.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Action Item #{index + 1}
                      </span>
                      <button
                        onClick={() => removeActionItem(item.id)}
                        disabled={meetingNotes.actionItems.length <= 1}
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
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.assignee}
                          onChange={(e) => updateActionItem(item.id, 'assignee', e.target.value)}
                          placeholder="Penanggung jawab"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => updateActionItem(item.id, 'dueDate', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) => updateActionItem(item.id, 'status', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="pending">Belum Dimulai</option>
                          <option value="in-progress">Dalam Proses</option>
                          <option value="completed">Selesai</option>
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
              
              <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Preview & Export Section */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pilih Template
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTemplate('professional')}
                  className={`p-4 rounded-lg border ${
                    template === 'professional'
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                      : 'border-gray-200 dark:border-gray-700'
                  } transition-all duration-200`}
                >
                  <div className="aspect-[3/4] bg-white dark:bg-gray-700 rounded-lg mb-2 flex flex-col">
                    <div className="h-4 w-3/4 bg-blue-500 dark:bg-blue-600 rounded-t-lg"></div>
                    <div className="flex-1 p-2">
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full mb-1"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
                    Professional
                  </div>
                </button>
                
                <button
                  onClick={() => setTemplate('simple')}
                  className={`p-4 rounded-lg border ${
                    template === 'simple'
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                      : 'border-gray-200 dark:border-gray-700'
                  } transition-all duration-200`}
                >
                  <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-700 rounded-lg mb-2 flex flex-col p-2">
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full mb-1"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
                    Simple
                  </div>
                </button>
                
                <button
                  onClick={() => setTemplate('colorful')}
                  className={`p-4 rounded-lg border ${
                    template === 'colorful'
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                      : 'border-gray-200 dark:border-gray-700'
                  } transition-all duration-200`}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg mb-2 flex flex-col">
                    <div className="h-4 bg-blue-500 dark:bg-blue-600 rounded-t-lg"></div>
                    <div className="flex-1 p-2">
                      <div className="h-8 bg-white dark:bg-gray-700 rounded mb-2 w-full"></div>
                      <div className="h-2 bg-white dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-2 bg-white dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
                    Colorful
                  </div>
                </button>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Opsi Ekspor
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Format Ekspor
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        checked={exportFormat === 'pdf'}
                        onChange={() => setExportFormat('pdf')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">PDF</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        checked={exportFormat === 'docx'}
                        onChange={() => setExportFormat('docx')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Word (DOCX)</span>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={exportNotes}
                  disabled={!meetingNotes.title || isExporting}
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
                      <span>Ekspor Notulen ({exportFormat.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className={`rounded-xl border p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ${getTemplateClass()}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview Notulen
              </h3>
              
              <div 
                ref={notesRef}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Meeting Notes Preview */}
                <div className="p-6">
                  {/* Title */}
                  <div className={getHeaderClass()}>
                    <h2 className={`text-xl font-bold ${template === 'colorful' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {meetingNotes.title || 'Judul Rapat'}
                    </h2>
                  </div>
                  
                  {/* Meeting Details */}
                  <div className={getSectionClass()}>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Tanggal:</span> {formatDate(meetingNotes.date)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Waktu:</span> {meetingNotes.startTime} - {meetingNotes.endTime}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Lokasi:</span> {meetingNotes.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Fasilitator:</span> {meetingNotes.facilitator}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Notulis:</span> {meetingNotes.notetaker}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className={getSectionClass()}>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Peserta
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Nama
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Jabatan/Peran
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {meetingNotes.participants
                            .filter(p => p.name.trim())
                            .map((participant) => (
                              <tr key={participant.id}>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {participant.name}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {participant.role}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Agenda */}
                  <div className={getSectionClass()}>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Agenda
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Topik
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Presenter
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Durasi
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Deskripsi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {meetingNotes.agenda
                            .filter(a => a.title.trim())
                            .map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.title}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.presenter}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.duration}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.description}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Summary */}
                  {meetingNotes.summary && (
                    <div className={getSectionClass()}>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Ringkasan Rapat
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {meetingNotes.summary}
                      </p>
                    </div>
                  )}
                  
                  {/* Decisions */}
                  <div className={getSectionClass()}>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Keputusan
                    </h3>
                    
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      {meetingNotes.decisions
                        .filter(d => d.description.trim())
                        .map((decision) => (
                          <li key={decision.id}>{decision.description}</li>
                        ))}
                    </ul>
                  </div>
                  
                  {/* Action Items */}
                  <div className={getSectionClass()}>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Action Items
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tugas
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Penanggung Jawab
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tenggat Waktu
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {meetingNotes.actionItems
                            .filter(a => a.description.trim())
                            .map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.description}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.assignee}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {item.dueDate ? formatDate(item.dueDate) : ''}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                                    {item.status === 'pending' ? 'Belum Dimulai' : 
                                     item.status === 'in-progress' ? 'Dalam Proses' : 'Selesai'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Next Meeting */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Rapat Berikutnya
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Tanggal:</span> {meetingNotes.nextMeetingDate ? formatDate(meetingNotes.nextMeetingDate) : 'Belum ditentukan'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Lokasi:</span> {meetingNotes.nextMeetingLocation || 'Belum ditentukan'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Terstruktur</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Format notulen profesional dengan semua elemen penting
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Action Items</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lacak tugas dan tanggung jawab dengan jelas
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Template</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Pilih template yang sesuai dengan kebutuhan Anda
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">📤</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Format</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor ke PDF atau Word untuk berbagi dengan tim
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;