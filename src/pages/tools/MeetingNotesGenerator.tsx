import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, Copy, Download, Plus, Trash2, Save, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
}

interface MeetingNote {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  facilitator: string;
  participants: Participant[];
  agenda: string[];
  notes: string;
  decisions: string[];
  actionItems: ActionItem[];
}

const MeetingNotesGenerator: React.FC = () => {
  const [meetingNote, setMeetingNote] = useState<MeetingNote>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    facilitator: '',
    participants: [{ id: '1', name: '', role: '' }],
    agenda: [''],
    notes: '',
    decisions: [''],
    actionItems: [{ id: '1', description: '', assignee: '', dueDate: '' }]
  });

  const [newParticipant, setNewParticipant] = useState({ name: '', role: '' });
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'professional' | 'corporate'>('professional');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  
  const notesRef = useRef<HTMLDivElement>(null);

  // Update meeting note
  const updateMeetingNote = <K extends keyof MeetingNote>(key: K, value: MeetingNote[K]) => {
    setMeetingNote(prev => ({ ...prev, [key]: value }));
  };

  // Add participant
  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    
    const participant = {
      id: Date.now().toString(),
      name: newParticipant.name.trim(),
      role: newParticipant.role.trim()
    };
    
    updateMeetingNote('participants', [...meetingNote.participants, participant]);
    setNewParticipant({ name: '', role: '' });
  };

  // Remove participant
  const removeParticipant = (id: string) => {
    updateMeetingNote('participants', meetingNote.participants.filter(p => p.id !== id));
  };

  // Add agenda item
  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    updateMeetingNote('agenda', [...meetingNote.agenda, newAgendaItem.trim()]);
    setNewAgendaItem('');
  };

  // Remove agenda item
  const removeAgendaItem = (index: number) => {
    updateMeetingNote('agenda', meetingNote.agenda.filter((_, i) => i !== index));
  };

  // Add decision
  const addDecision = () => {
    if (!newDecision.trim()) return;
    updateMeetingNote('decisions', [...meetingNote.decisions, newDecision.trim()]);
    setNewDecision('');
  };

  // Remove decision
  const removeDecision = (index: number) => {
    updateMeetingNote('decisions', meetingNote.decisions.filter((_, i) => i !== index));
  };

  // Add action item
  const addActionItem = () => {
    const actionItem = {
      id: Date.now().toString(),
      description: '',
      assignee: '',
      dueDate: ''
    };
    
    updateMeetingNote('actionItems', [...meetingNote.actionItems, actionItem]);
  };

  // Update action item
  const updateActionItem = (id: string, field: keyof ActionItem, value: string) => {
    updateMeetingNote('actionItems', meetingNote.actionItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Remove action item
  const removeActionItem = (id: string) => {
    updateMeetingNote('actionItems', meetingNote.actionItems.filter(item => item.id !== id));
  };

  // Generate text notes
  const generateTextNotes = (): string => {
    let notes = `# ${meetingNote.title}\n\n`;
    notes += `Date: ${meetingNote.date}\n`;
    notes += `Time: ${meetingNote.startTime} - ${meetingNote.endTime}\n`;
    notes += `Location: ${meetingNote.location}\n`;
    notes += `Facilitator: ${meetingNote.facilitator}\n\n`;
    
    notes += `## Participants\n`;
    meetingNote.participants.forEach(p => {
      notes += `- ${p.name}${p.role ? ` (${p.role})` : ''}\n`;
    });
    notes += '\n';
    
    notes += `## Agenda\n`;
    meetingNote.agenda.forEach((item, index) => {
      if (item.trim()) notes += `${index + 1}. ${item}\n`;
    });
    notes += '\n';
    
    notes += `## Meeting Notes\n${meetingNote.notes}\n\n`;
    
    notes += `## Decisions Made\n`;
    meetingNote.decisions.forEach((decision, index) => {
      if (decision.trim()) notes += `${index + 1}. ${decision}\n`;
    });
    notes += '\n';
    
    notes += `## Action Items\n`;
    meetingNote.actionItems.forEach(item => {
      if (item.description.trim()) {
        notes += `- ${item.description}`;
        if (item.assignee) notes += ` (Assignee: ${item.assignee})`;
        if (item.dueDate) notes += ` (Due: ${item.dueDate})`;
        notes += '\n';
      }
    });
    
    return notes;
  };

  // Copy notes to clipboard
  const copyToClipboard = async () => {
    const notes = generateTextNotes();
    
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
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
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text(meetingNote.title || 'Meeting Notes', 105, 15, { align: 'center' });
      
      // Add date and time
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const dateTimeText = `${meetingNote.date} • ${meetingNote.startTime} - ${meetingNote.endTime}`;
      pdf.text(dateTimeText, 105, 25, { align: 'center' });
      
      // Add location and facilitator
      if (meetingNote.location || meetingNote.facilitator) {
        const locationFacilitatorText = `${meetingNote.location}${meetingNote.location && meetingNote.facilitator ? ' • ' : ''}${meetingNote.facilitator ? `Facilitator: ${meetingNote.facilitator}` : ''}`;
        pdf.text(locationFacilitatorText, 105, 32, { align: 'center' });
      }
      
      // Add a decorative line
      pdf.setDrawColor(41, 128, 185); // Blue color
      pdf.setLineWidth(0.5);
      pdf.line(20, 38, 190, 38);
      
      let position = 45; // Start position after title and header
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save(`${meetingNote.title || 'meeting-notes'}.pdf`);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Word (DOCX)
  const exportToWord = async () => {
    setIsExporting(true);
    
    try {
      // Create a new document
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
                size: 36, // 18pt
                bold: true,
                color: "2B579A", // Blue
              },
              paragraph: {
                spacing: {
                  after: 240, // 12pt
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
                size: 28, // 14pt
                bold: true,
                color: "2B579A", // Blue
              },
              paragraph: {
                spacing: {
                  before: 240, // 12pt
                  after: 120, // 6pt
                },
              },
            },
            {
              id: "Normal",
              name: "Normal",
              next: "Normal",
              run: {
                size: 24, // 12pt
              },
              paragraph: {
                spacing: {
                  line: 276, // 1.15
                },
              },
            },
          ],
        },
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: meetingNote.title || "Meeting Notes",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              
              // Meeting Info
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${meetingNote.date}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Time: ${meetingNote.startTime} - ${meetingNote.endTime}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Location: ${meetingNote.location}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Facilitator: ${meetingNote.facilitator}`,
                    bold: true,
                  }),
                ],
                spacing: {
                  after: 240, // 12pt
                },
              }),
              
              // Participants
              new Paragraph({
                text: "Participants",
                heading: HeadingLevel.HEADING_2,
              }),
              ...meetingNote.participants.map(
                (participant) =>
                  new Paragraph({
                    children: [
                      new TextRun("• "),
                      new TextRun({
                        text: participant.name,
                      }),
                      new TextRun({
                        text: participant.role ? ` (${participant.role})` : "",
                        italics: true,
                      }),
                    ],
                  })
              ),
              new Paragraph({ text: "" }),
              
              // Agenda
              new Paragraph({
                text: "Agenda",
                heading: HeadingLevel.HEADING_2,
              }),
              ...meetingNote.agenda
                .filter((item) => item.trim())
                .map(
                  (item, index) =>
                    new Paragraph({
                      children: [
                        new TextRun(`${index + 1}. `),
                        new TextRun({
                          text: item,
                        }),
                      ],
                    })
                ),
              new Paragraph({ text: "" }),
              
              // Meeting Notes
              new Paragraph({
                text: "Meeting Notes",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                text: meetingNote.notes,
              }),
              new Paragraph({ text: "" }),
              
              // Decisions
              new Paragraph({
                text: "Decisions Made",
                heading: HeadingLevel.HEADING_2,
              }),
              ...meetingNote.decisions
                .filter((decision) => decision.trim())
                .map(
                  (decision, index) =>
                    new Paragraph({
                      children: [
                        new TextRun(`${index + 1}. `),
                        new TextRun({
                          text: decision,
                        }),
                      ],
                    })
                ),
              new Paragraph({ text: "" }),
              
              // Action Items
              new Paragraph({
                text: "Action Items",
                heading: HeadingLevel.HEADING_2,
              }),
            ],
          },
        ],
      });
      
      // Add action items table
      const actionItems = meetingNote.actionItems.filter(item => item.description.trim());
      if (actionItems.length > 0) {
        const table = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
            bottom: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
            left: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
            right: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
            insideHorizontal: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
            insideVertical: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
          },
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "Action Item", bold: true })],
                  shading: {
                    fill: "F2F2F2",
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Assignee", bold: true })],
                  shading: {
                    fill: "F2F2F2",
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Due Date", bold: true })],
                  shading: {
                    fill: "F2F2F2",
                  },
                }),
              ],
            }),
            // Data rows
            ...actionItems.map(
              (item) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph(item.description)],
                    }),
                    new TableCell({
                      children: [new Paragraph(item.assignee || "")],
                    }),
                    new TableCell({
                      children: [new Paragraph(item.dueDate || "")],
                    }),
                  ],
                })
            ),
          ],
        });
        
        doc.addSection({
          children: [table],
        });
      }
      
      // Generate and save document
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${meetingNote.title || 'meeting-notes'}.docx`);
      });
      
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Error exporting to Word. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get template class
  const getTemplateClass = () => {
    switch (selectedTemplate) {
      case 'simple':
        return 'bg-white dark:bg-gray-800';
      case 'professional':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      case 'corporate':
        return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50';
      default:
        return 'bg-white dark:bg-gray-800';
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
            <li>Buat notulen rapat dengan format profesional</li>
            <li>Tambahkan peserta, agenda, dan action items</li>
            <li>Pilih template yang sesuai dengan kebutuhan</li>
            <li>Ekspor ke PDF atau Word untuk dibagikan</li>
            <li>Simpan dan bagikan notulen dengan mudah</li>
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
                    Judul Rapat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rapat Mingguan Tim Marketing"
                    value={meetingNote.title}
                    onChange={(e) => updateMeetingNote('title', e.target.value)}
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
                      value={meetingNote.date}
                      onChange={(e) => updateMeetingNote('date', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      value={meetingNote.startTime}
                      onChange={(e) => updateMeetingNote('startTime', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Waktu Selesai
                    </label>
                    <input
                      type="time"
                      value={meetingNote.endTime}
                      onChange={(e) => updateMeetingNote('endTime', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Ruang Rapat Utama"
                      value={meetingNote.location}
                      onChange={(e) => updateMeetingNote('location', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fasilitator
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={meetingNote.facilitator}
                      onChange={(e) => updateMeetingNote('facilitator', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Peserta Rapat
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nama Peserta"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Jabatan/Peran (opsional)"
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    onClick={addParticipant}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {meetingNote.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{participant.name}</span>
                        {participant.role && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({participant.role})</span>
                        )}
                      </div>
                      <button 
                        onClick={() => removeParticipant(participant.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Agenda */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Agenda Rapat
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Item agenda"
                    value={newAgendaItem}
                    onChange={(e) => setNewAgendaItem(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    onClick={addAgendaItem}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {meetingNote.agenda.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-900 dark:text-white">{index + 1}. {item}</span>
                      <button 
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Catatan Rapat
              </h3>
              
              <textarea
                placeholder="Masukkan catatan rapat di sini..."
                value={meetingNote.notes}
                onChange={(e) => updateMeetingNote('notes', e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Decisions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Keputusan yang Diambil
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Keputusan yang diambil"
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    onClick={addDecision}
                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {meetingNote.decisions.map((decision, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-900 dark:text-white">{index + 1}. {decision}</span>
                      <button 
                        onClick={() => removeDecision(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 flex items-center space-x-1 shadow-md shadow-blue-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {meetingNote.actionItems.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="Deskripsi tugas"
                          value={item.description}
                          onChange={(e) => updateActionItem(item.id, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Penanggung jawab"
                          value={item.assignee}
                          onChange={(e) => updateActionItem(item.id, 'assignee', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => updateActionItem(item.id, 'dueDate', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button 
                          onClick={() => removeActionItem(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  onClick={() => setSelectedTemplate('simple')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedTemplate === 'simple'
                      ? 'border-blue-500 dark:border-blue-400 shadow-md shadow-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="h-20 bg-white dark:bg-gray-800 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-xs">Simple</span>
                  </div>
                  <div className="text-sm font-medium text-center text-gray-900 dark:text-white">Simple</div>
                </button>
                
                <button
                  onClick={() => setSelectedTemplate('professional')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedTemplate === 'professional'
                      ? 'border-blue-500 dark:border-blue-400 shadow-md shadow-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="h-20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded mb-2 flex items-center justify-center">
                    <span className="text-blue-400 dark:text-blue-500 text-xs">Professional</span>
                  </div>
                  <div className="text-sm font-medium text-center text-gray-900 dark:text-white">Professional</div>
                </button>
                
                <button
                  onClick={() => setSelectedTemplate('corporate')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedTemplate === 'corporate'
                      ? 'border-blue-500 dark:border-blue-400 shadow-md shadow-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="h-20 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-xs">Corporate</span>
                  </div>
                  <div className="text-sm font-medium text-center text-gray-900 dark:text-white">Corporate</div>
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview Notulen
              </h3>
              
              <div 
                ref={notesRef}
                className={`${getTemplateClass()} rounded-lg p-6 border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto`}
              >
                {selectedTemplate === 'professional' && (
                  <div className="border-b-2 border-blue-500 dark:border-blue-400 pb-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{meetingNote.title || 'Judul Rapat'}</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {meetingNote.date && new Date(meetingNote.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          {meetingNote.startTime && meetingNote.endTime && ` • ${meetingNote.startTime} - ${meetingNote.endTime}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700 dark:text-gray-300">{meetingNote.location}</p>
                        <p className="text-gray-600 dark:text-gray-400">Fasilitator: {meetingNote.facilitator}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedTemplate === 'corporate' && (
                  <div className="bg-gray-800 text-white p-4 rounded-t-lg mb-6">
                    <h2 className="text-xl font-bold">{meetingNote.title || 'Judul Rapat'}</h2>
                    <div className="flex justify-between text-sm mt-2">
                      <p>{meetingNote.date && new Date(meetingNote.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p>{meetingNote.startTime && meetingNote.endTime && `${meetingNote.startTime} - ${meetingNote.endTime}`}</p>
                    </div>
                  </div>
                )}
                
                {selectedTemplate === 'simple' && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meetingNote.title || 'Judul Rapat'}</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {meetingNote.date && new Date(meetingNote.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {meetingNote.startTime && meetingNote.endTime && ` • ${meetingNote.startTime} - ${meetingNote.endTime}`}
                      {meetingNote.location && ` • ${meetingNote.location}`}
                    </p>
                    {meetingNote.facilitator && <p className="text-gray-600 dark:text-gray-400">Fasilitator: {meetingNote.facilitator}</p>}
                  </div>
                )}
                
                {/* Participants Section */}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    selectedTemplate === 'professional' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : selectedTemplate === 'corporate'
                        ? 'text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    Peserta
                  </h3>
                  <div className={`${
                    selectedTemplate === 'professional' 
                      ? 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm' 
                      : ''
                  }`}>
                    <ul className="list-disc list-inside">
                      {meetingNote.participants.map((participant) => (
                        <li key={participant.id} className="text-gray-700 dark:text-gray-300">
                          {participant.name}{participant.role && ` (${participant.role})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Agenda Section */}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    selectedTemplate === 'professional' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : selectedTemplate === 'corporate'
                        ? 'text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    Agenda
                  </h3>
                  <div className={`${
                    selectedTemplate === 'professional' 
                      ? 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm' 
                      : ''
                  }`}>
                    <ol className="list-decimal list-inside">
                      {meetingNote.agenda.map((item, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{item}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                {/* Notes Section */}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    selectedTemplate === 'professional' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : selectedTemplate === 'corporate'
                        ? 'text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    Catatan Rapat
                  </h3>
                  <div className={`${
                    selectedTemplate === 'professional' 
                      ? 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm' 
                      : ''
                  }`}>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {meetingNote.notes || 'Belum ada catatan rapat.'}
                    </div>
                  </div>
                </div>
                
                {/* Decisions Section */}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    selectedTemplate === 'professional' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : selectedTemplate === 'corporate'
                        ? 'text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    Keputusan
                  </h3>
                  <div className={`${
                    selectedTemplate === 'professional' 
                      ? 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm' 
                      : ''
                  }`}>
                    <ol className="list-decimal list-inside">
                      {meetingNote.decisions.map((decision, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{decision}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                {/* Action Items Section */}
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    selectedTemplate === 'professional' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : selectedTemplate === 'corporate'
                        ? 'text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    Action Items
                  </h3>
                  <div className={`${
                    selectedTemplate === 'professional' 
                      ? 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm' 
                      : ''
                  }`}>
                    {meetingNote.actionItems.length > 0 ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 text-gray-700 dark:text-gray-300">Tugas</th>
                            <th className="py-2 text-gray-700 dark:text-gray-300">Penanggung Jawab</th>
                            <th className="py-2 text-gray-700 dark:text-gray-300">Tenggat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meetingNote.actionItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="py-2 text-gray-700 dark:text-gray-300">{item.description}</td>
                              <td className="py-2 text-gray-700 dark:text-gray-300">{item.assignee}</td>
                              <td className="py-2 text-gray-700 dark:text-gray-300">
                                {item.dueDate && new Date(item.dueDate).toLocaleDateString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">Belum ada action items.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ekspor & Bagikan
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                      exportFormat === 'pdf'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setExportFormat('docx')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                      exportFormat === 'docx'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Word (DOCX)
                  </button>
                </div>
                
                <button 
                  onClick={copyToClipboard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin ke Clipboard'}</span>
                </button>
                
                <button 
                  onClick={exportFormat === 'pdf' ? exportToPDF : exportToWord}
                  disabled={isExporting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Mengekspor...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Ekspor ke {exportFormat === 'pdf' ? 'PDF' : 'Word'}</span>
                    </>
                  )}
                </button>
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
              Format notulen yang terorganisir dan profesional
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
              Pilih dari beberapa template profesional
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Format</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor ke PDF, Word, atau salin teks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;