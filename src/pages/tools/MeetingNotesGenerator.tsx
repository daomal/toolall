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
    title: 'Rapat Perencanaan Proyek Q3',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    location: 'Ruang Rapat Utama',
    facilitator: 'Budi Santoso',
    notetaker: 'Dewi Anggraini',
    participants: [
      { id: '1', name: 'Budi Santoso', role: 'Project Manager' },
      { id: '2', name: 'Dewi Anggraini', role: 'Business Analyst' },
      { id: '3', name: 'Ahmad Hidayat', role: 'Lead Developer' }
    ],
    agenda: [
      { id: '1', title: 'Review Proyek Q2', description: 'Evaluasi pencapaian dan kendala proyek Q2', duration: '20', presenter: 'Budi Santoso' },
      { id: '2', title: 'Perencanaan Proyek Q3', description: 'Diskusi target dan timeline proyek Q3', duration: '30', presenter: 'Ahmad Hidayat' },
      { id: '3', title: 'Alokasi Anggaran', description: 'Pembahasan alokasi anggaran untuk Q3', duration: '20', presenter: 'Dewi Anggraini' }
    ],
    summary: 'Rapat membahas evaluasi proyek Q2 dan perencanaan untuk Q3. Tim sepakat untuk fokus pada pengembangan fitur baru dan perbaikan performa aplikasi. Anggaran Q3 akan ditingkatkan 15% dari Q2 untuk mendukung penambahan sumber daya.',
    decisions: [
      { id: '1', description: 'Memprioritaskan pengembangan fitur pembayaran online untuk Q3' },
      { id: '2', description: 'Menambah 2 developer baru untuk tim backend' },
      { id: '3', description: 'Meningkatkan anggaran pemasaran sebesar 15%' }
    ],
    actionItems: [
      { id: '1', description: 'Menyiapkan dokumen spesifikasi fitur pembayaran online', assignee: 'Dewi Anggraini', dueDate: '2025-07-10', status: 'pending' },
      { id: '2', description: 'Memulai proses rekrutmen untuk developer backend', assignee: 'Budi Santoso', dueDate: '2025-07-15', status: 'in-progress' },
      { id: '3', description: 'Menyusun rencana anggaran pemasaran Q3', assignee: 'Ahmad Hidayat', dueDate: '2025-07-20', status: 'completed' }
    ],
    nextMeetingDate: '',
    nextMeetingLocation: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  
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
    updateMeetingNotes('actionItems', meetingNotes.actionItems.filter(a => a.id !== id));
  };

  // Update action item
  const updateActionItem = <K extends keyof ActionItem>(id: string, field: K, value: ActionItem[K]) => {
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

  // Get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
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
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to PDF
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
      pdf.save(`${meetingNotes.title.replace(/\s+/g, '_')}_notes.pdf`);
      
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
                text: meetingNotes.title,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200
                }
              }),
              
              // Meeting Info
              new Paragraph({
                children: [
                  new TextRun({ text: "Tanggal: ", bold: true }),
                  new TextRun(formatDate(meetingNotes.date)),
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Waktu: ", bold: true }),
                  new TextRun(`${meetingNotes.startTime} - ${meetingNotes.endTime}`),
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Lokasi: ", bold: true }),
                  new TextRun(meetingNotes.location),
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Fasilitator: ", bold: true }),
                  new TextRun(meetingNotes.facilitator),
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Notulen: ", bold: true }),
                  new TextRun(meetingNotes.notetaker),
                ],
                spacing: { after: 200 }
              }),
              
              // Participants
              new Paragraph({
                text: "Peserta",
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
                        children: [new Paragraph("Nama")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("Jabatan")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.participants.map(
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
                ],
              }),
              
              new Paragraph({
                text: "",
                spacing: { after: 200 }
              }),
              
              // Agenda
              new Paragraph({
                text: "Agenda",
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
                        children: [new Paragraph("Topik")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("Deskripsi")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("Durasi")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("Presenter")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.agenda.map(
                    (item) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph(item.title)],
                          }),
                          new TableCell({
                            children: [new Paragraph(item.description)],
                          }),
                          new TableCell({
                            children: [new Paragraph(`${item.duration} menit`)],
                          }),
                          new TableCell({
                            children: [new Paragraph(item.presenter)],
                          }),
                        ],
                      })
                  ),
                ],
              }),
              
              new Paragraph({
                text: "",
                spacing: { after: 200 }
              }),
              
              // Summary
              new Paragraph({
                text: "Ringkasan Rapat",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                text: meetingNotes.summary,
                spacing: { after: 200 }
              }),
              
              // Decisions
              new Paragraph({
                text: "Keputusan",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
              }),
              
              ...meetingNotes.decisions.map(
                (decision, index) =>
                  new Paragraph({
                    text: `${index + 1}. ${decision.description}`,
                    spacing: { after: 100 }
                  })
              ),
              
              new Paragraph({
                text: "",
                spacing: { after: 200 }
              }),
              
              // Action Items
              new Paragraph({
                text: "Action Items",
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
                        children: [new Paragraph("Tugas")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("PIC")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("Deadline")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("Status")],
                        shading: {
                          fill: "EEEEEE",
                          type: ShadingType.CLEAR,
                        },
                      }),
                    ],
                  }),
                  ...meetingNotes.actionItems.map(
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
                            children: [new Paragraph(formatDate(item.dueDate))],
                          }),
                          new TableCell({
                            children: [new Paragraph(getStatusLabel(item.status))],
                          }),
                        ],
                      })
                  ),
                ],
              }),
              
              new Paragraph({
                text: "",
                spacing: { after: 200 }
              }),
              
              // Next Meeting
              ...(meetingNotes.nextMeetingDate ? [
                new Paragraph({
                  text: "Rapat Berikutnya",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { after: 100 }
                }),
                
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tanggal: ", bold: true }),
                    new TextRun(formatDate(meetingNotes.nextMeetingDate)),
                  ],
                  spacing: { after: 100 }
                }),
                
                new Paragraph({
                  children: [
                    new TextRun({ text: "Lokasi: ", bold: true }),
                    new TextRun(meetingNotes.nextMeetingLocation),
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
            ],
          },
        ],
      });
      
      // Generate and save document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${meetingNotes.title.replace(/\s+/g, '_')}_notes.docx`);
      
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

        {/* Main Content */}
        {!showPreview ? (
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
                      placeholder="Contoh: Rapat Perencanaan Proyek Q3"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fasilitator
                      </label>
                      <input
                        type="text"
                        value={meetingNotes.facilitator}
                        onChange={(e) => updateMeetingNotes('facilitator', e.target.value)}
                        placeholder="Nama fasilitator"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notulen
                      </label>
                      <input
                        type="text"
                        value={meetingNotes.notetaker}
                        onChange={(e) => updateMeetingNotes('notetaker', e.target.value)}
                        placeholder="Nama notulen"
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
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                          placeholder="Nama"
                          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={participant.role}
                          onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                          placeholder="Jabatan"
                          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.agenda.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Item #{index + 1}
                        </span>
                        <button
                          onClick={() => removeAgendaItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                        
                        <textarea
                          value={item.description}
                          onChange={(e) => updateAgendaItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi"
                          rows={2}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Durasi (menit)
                            </label>
                            <input
                              type="number"
                              value={item.duration}
                              onChange={(e) => updateAgendaItem(item.id, 'duration', e.target.value)}
                              placeholder="Durasi"
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Presenter
                            </label>
                            <input
                              type="text"
                              value={item.presenter}
                              onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                              placeholder="Presenter"
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Meeting Content */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ringkasan Rapat
                </h3>
                
                <textarea
                  value={meetingNotes.summary}
                  onChange={(e) => updateMeetingNotes('summary', e.target.value)}
                  placeholder="Ringkasan hasil rapat..."
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
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
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
                          placeholder="Deskripsi keputusan"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => removeDecision(decision.id)}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.actionItems.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Task #{index + 1}
                        </span>
                        <button
                          onClick={() => removeActionItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <textarea
                          value={item.description}
                          onChange={(e) => updateActionItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi tugas"
                          rows={2}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={item.assignee}
                            onChange={(e) => updateActionItem(item.id, 'assignee', e.target.value)}
                            placeholder="PIC"
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateActionItem(item.id, 'dueDate', e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Status
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) => updateActionItem(item.id, 'status', e.target.value as any)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Rapat Berikutnya (Opsional)
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

              {/* Preview & Export */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview & Ekspor
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
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Preview</span>
                    </button>
                    
                    <button
                      onClick={exportNotes}
                      disabled={isExporting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview Notulen Rapat
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors duration-200"
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
            
            {/* Meeting Notes Preview */}
            <div ref={notesRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {meetingNotes.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatDate(meetingNotes.date)} | {meetingNotes.startTime} - {meetingNotes.endTime} | {meetingNotes.location}
                </p>
              </div>
              
              {/* Meeting Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Informasi Rapat
                  </h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 text-gray-600 dark:text-gray-400">Fasilitator:</span>
                      <span className="text-gray-900 dark:text-white">{meetingNotes.facilitator}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600 dark:text-gray-400">Notulen:</span>
                      <span className="text-gray-900 dark:text-white">{meetingNotes.notetaker}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Peserta
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {meetingNotes.participants.map((participant) => (
                      <div key={participant.id} className="text-sm">
                        <span className="text-gray-900 dark:text-white">{participant.name}</span>
                        {participant.role && (
                          <span className="text-gray-600 dark:text-gray-400"> ({participant.role})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Agenda */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Agenda
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Topik</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deskripsi</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durasi</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Presenter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {meetingNotes.agenda.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.duration} menit</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.presenter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Ringkasan Rapat
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {meetingNotes.summary}
                </p>
              </div>
              
              {/* Decisions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Keputusan
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {meetingNotes.decisions.map((decision) => (
                    <li key={decision.id}>{decision.description}</li>
                  ))}
                </ul>
              </div>
              
              {/* Action Items */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Action Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tugas</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PIC</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deadline</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {meetingNotes.actionItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.assignee}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(item.dueDate)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                              {getStatusLabel(item.status)}
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
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Rapat Berikutnya
                  </h3>
                  <div className="space-y-2">
                    {meetingNotes.nextMeetingDate && (
                      <div className="flex">
                        <span className="w-32 text-gray-600 dark:text-gray-400">Tanggal:</span>
                        <span className="text-gray-900 dark:text-white">{formatDate(meetingNotes.nextMeetingDate)}</span>
                      </div>
                    )}
                    {meetingNotes.nextMeetingLocation && (
                      <div className="flex">
                        <span className="w-32 text-gray-600 dark:text-gray-400">Lokasi:</span>
                        <span className="text-gray-900 dark:text-white">{meetingNotes.nextMeetingLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Export Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors duration-200"
              >
                Kembali ke Editor
              </button>
              
              <button
                onClick={exportNotes}
                disabled={isExporting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
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
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Terstruktur</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Format notulen profesional dengan semua elemen penting
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Action Items</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lacak tugas dengan PIC, deadline, dan status
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Format</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor ke PDF atau Word sesuai kebutuhan
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">👁️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Preview</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lihat tampilan akhir sebelum mengekspor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;