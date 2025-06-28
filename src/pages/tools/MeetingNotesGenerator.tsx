import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, Plus, Check, Clock, User, Download, Copy, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

interface Attendee {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  status?: 'pending' | 'in-progress' | 'completed';
}

interface MeetingNote {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  facilitator: string;
  notetaker: string;
  attendees: Attendee[];
  agenda: string[];
  discussion: string;
  decisions: string;
  actionItems: ActionItem[];
}

const MeetingNotesGenerator: React.FC = () => {
  // State for meeting note
  const [meetingNote, setMeetingNote] = useState<MeetingNote>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    facilitator: '',
    notetaker: '',
    attendees: [],
    agenda: [],
    discussion: '',
    decisions: '',
    actionItems: []
  });
  
  // State for new items
  const [newAttendee, setNewAttendee] = useState<{
    name: string;
    role: string;
    email: string;
  }>({
    name: '',
    role: '',
    email: ''
  });
  
  const [newAgendaItem, setNewAgendaItem] = useState<string>('');
  const [newActionItem, setNewActionItem] = useState<{
    description: string;
    assignee: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>({
    description: '',
    assignee: '',
    dueDate: '',
    status: 'pending'
  });
  
  // State for output format
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'word' | 'html' | 'text' | 'markdown'>('text');
  const [template, setTemplate] = useState<'standard' | 'minimal' | 'formal' | 'modern'>('standard');
  
  // State for copy status
  const [copied, setCopied] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  
  // Refs
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update meeting note
  const updateMeetingNote = <K extends keyof MeetingNote>(key: K, value: MeetingNote[K]) => {
    setMeetingNote(prev => ({ ...prev, [key]: value }));
  };
  
  // Add attendee
  const addAttendee = () => {
    if (!newAttendee.name.trim()) return;
    
    const newAttendeeObj: Attendee = {
      id: Date.now().toString(),
      name: newAttendee.name.trim(),
      role: newAttendee.role.trim() || undefined,
      email: newAttendee.email.trim() || undefined
    };
    
    updateMeetingNote('attendees', [...meetingNote.attendees, newAttendeeObj]);
    setNewAttendee({
      name: '',
      role: '',
      email: ''
    });
  };
  
  // Remove attendee
  const removeAttendee = (id: string) => {
    updateMeetingNote('attendees', meetingNote.attendees.filter(attendee => attendee.id !== id));
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
  
  // Add action item
  const addActionItem = () => {
    if (!newActionItem.description.trim() || !newActionItem.assignee.trim()) return;
    
    const newActionItemObj: ActionItem = {
      id: Date.now().toString(),
      description: newActionItem.description.trim(),
      assignee: newActionItem.assignee.trim(),
      dueDate: newActionItem.dueDate,
      status: newActionItem.status
    };
    
    updateMeetingNote('actionItems', [...meetingNote.actionItems, newActionItemObj]);
    setNewActionItem({
      description: '',
      assignee: '',
      dueDate: '',
      status: 'pending'
    });
  };
  
  // Remove action item
  const removeActionItem = (id: string) => {
    updateMeetingNote('actionItems', meetingNote.actionItems.filter(item => item.id !== id));
  };
  
  // Update action item status
  const updateActionItemStatus = (id: string, status: 'pending' | 'in-progress' | 'completed') => {
    updateMeetingNote('actionItems', meetingNote.actionItems.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };
  
  // Generate meeting notes in text format
  const generateTextNotes = (): string => {
    let notes = '';
    
    // Title and basic info
    notes += `# ${meetingNote.title || 'Meeting Notes'}\n\n`;
    notes += `**Date:** ${meetingNote.date ? new Date(meetingNote.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}\n`;
    
    if (meetingNote.startTime || meetingNote.endTime) {
      notes += `**Time:** ${meetingNote.startTime || ''}${meetingNote.startTime && meetingNote.endTime ? ' - ' : ''}${meetingNote.endTime || ''}\n`;
    }
    
    if (meetingNote.location) {
      notes += `**Location:** ${meetingNote.location}\n`;
    }
    
    if (meetingNote.facilitator) {
      notes += `**Facilitator:** ${meetingNote.facilitator}\n`;
    }
    
    if (meetingNote.notetaker) {
      notes += `**Note Taker:** ${meetingNote.notetaker}\n`;
    }
    
    // Attendees
    if (meetingNote.attendees.length > 0) {
      notes += `\n## Attendees\n\n`;
      meetingNote.attendees.forEach(attendee => {
        let attendeeInfo = `- ${attendee.name}`;
        if (attendee.role) attendeeInfo += `, ${attendee.role}`;
        if (attendee.email) attendeeInfo += ` (${attendee.email})`;
        notes += `${attendeeInfo}\n`;
      });
    }
    
    // Agenda
    if (meetingNote.agenda.length > 0) {
      notes += `\n## Agenda\n\n`;
      meetingNote.agenda.forEach((item, index) => {
        notes += `${index + 1}. ${item}\n`;
      });
    }
    
    // Discussion
    if (meetingNote.discussion) {
      notes += `\n## Discussion Points\n\n${meetingNote.discussion}\n`;
    }
    
    // Decisions
    if (meetingNote.decisions) {
      notes += `\n## Decisions Made\n\n${meetingNote.decisions}\n`;
    }
    
    // Action Items
    if (meetingNote.actionItems.length > 0) {
      notes += `\n## Action Items\n\n`;
      meetingNote.actionItems.forEach((item, index) => {
        notes += `${index + 1}. **${item.description}**\n`;
        notes += `   - Assigned to: ${item.assignee}\n`;
        if (item.dueDate) {
          notes += `   - Due date: ${new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
        }
        if (item.status) {
          notes += `   - Status: ${item.status}\n`;
        }
        notes += '\n';
      });
    }
    
    // Footer
    notes += `\n---\n`;
    notes += `Meeting notes generated on ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
    
    return notes;
  };
  
  // Generate meeting notes in HTML format
  const generateHtmlNotes = (): string => {
    let html = '';
    
    // Choose template style
    let cssStyle = '';
    
    switch (template) {
      case 'minimal':
        cssStyle = `
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          h2 { color: #444; margin-top: 20px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          ul, ol { padding-left: 20px; }
          .action-item { margin-bottom: 10px; }
          .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 0.8em; color: #777; }
        `;
        break;
      case 'formal':
        cssStyle = `
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
          h2 { font-size: 18px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          ul, ol { padding-left: 20px; }
          .action-item { margin-bottom: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 0.9em; }
        `;
        break;
      case 'modern':
        cssStyle = `
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; font-weight: 600; }
          h2 { color: #4b5563; font-weight: 600; margin-top: 25px; border-left: 4px solid #2563eb; padding-left: 10px; }
          .info { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          ul, ol { padding-left: 20px; }
          .action-item { background-color: #f9fafb; padding: 10px; border-radius: 8px; margin-bottom: 10px; }
          .action-item strong { color: #2563eb; }
          .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 0.8em; color: #6b7280; }
        `;
        break;
      default: // standard
        cssStyle = `
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          h2 { color: #4b5563; margin-top: 20px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          ul, ol { padding-left: 20px; }
          .action-item { margin-bottom: 10px; }
          .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 0.8em; color: #777; }
        `;
    }
    
    // Start HTML document
    html += `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${meetingNote.title || 'Meeting Notes'}</title>
  <style>
    ${cssStyle}
  </style>
</head>
<body>
  <h1>${meetingNote.title || 'Meeting Notes'}</h1>
  
  <div class="info">
    <p><strong>Date:</strong> ${meetingNote.date ? new Date(meetingNote.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
    ${(meetingNote.startTime || meetingNote.endTime) ? `<p><strong>Time:</strong> ${meetingNote.startTime || ''}${meetingNote.startTime && meetingNote.endTime ? ' - ' : ''}${meetingNote.endTime || ''}</p>` : ''}
    ${meetingNote.location ? `<p><strong>Location:</strong> ${meetingNote.location}</p>` : ''}
    ${meetingNote.facilitator ? `<p><strong>Facilitator:</strong> ${meetingNote.facilitator}</p>` : ''}
    ${meetingNote.notetaker ? `<p><strong>Note Taker:</strong> ${meetingNote.notetaker}</p>` : ''}
  </div>`;
  
  // Attendees
  if (meetingNote.attendees.length > 0) {
    html += `
  <h2>Attendees</h2>
  <ul>`;
    meetingNote.attendees.forEach(attendee => {
      let attendeeInfo = `${attendee.name}`;
      if (attendee.role) attendeeInfo += `, ${attendee.role}`;
      if (attendee.email) attendeeInfo += ` (${attendee.email})`;
      html += `
    <li>${attendeeInfo}</li>`;
    });
    html += `
  </ul>`;
  }
  
  // Agenda
  if (meetingNote.agenda.length > 0) {
    html += `
  <h2>Agenda</h2>
  <ol>`;
    meetingNote.agenda.forEach(item => {
      html += `
    <li>${item}</li>`;
    });
    html += `
  </ol>`;
  }
  
  // Discussion
  if (meetingNote.discussion) {
    html += `
  <h2>Discussion Points</h2>
  <div>${meetingNote.discussion.replace(/\n/g, '<br>')}</div>`;
  }
  
  // Decisions
  if (meetingNote.decisions) {
    html += `
  <h2>Decisions Made</h2>
  <div>${meetingNote.decisions.replace(/\n/g, '<br>')}</div>`;
  }
  
  // Action Items
  if (meetingNote.actionItems.length > 0) {
    html += `
  <h2>Action Items</h2>`;
    meetingNote.actionItems.forEach((item, index) => {
      html += `
  <div class="action-item">
    <p><strong>${index + 1}. ${item.description}</strong></p>
    <p>Assigned to: ${item.assignee}</p>`;
      if (item.dueDate) {
        html += `
    <p>Due date: ${new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>`;
      }
      if (item.status) {
        html += `
    <p>Status: ${item.status}</p>`;
      }
      html += `
  </div>`;
    });
  }
  
  // Footer
  html += `
  <div class="footer">
    <p>Meeting notes generated on ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
</body>
</html>`;
  
  return html;
  };
  
  // Generate meeting notes in Markdown format
  const generateMarkdownNotes = (): string => {
    return generateTextNotes(); // Text format is already in Markdown
  };
  
  // Copy notes to clipboard
  const copyToClipboard = async () => {
    let content = '';
    
    switch (outputFormat) {
      case 'html':
        content = generateHtmlNotes();
        break;
      case 'markdown':
        content = generateMarkdownNotes();
        break;
      default:
        content = generateTextNotes();
    }
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Gagal menyalin ke clipboard');
    }
  };
  
  // Export notes
  const exportNotes = async () => {
    if (!meetingNote.title) {
      alert('Harap isi judul rapat terlebih dahulu!');
      return;
    }
    
    setExportStatus('processing');
    
    try {
      const fileName = meetingNote.title.replace(/\s+/g, '_').toLowerCase();
      
      switch (outputFormat) {
        case 'pdf':
          // Generate PDF
          const doc = new jsPDF();
          
          // Set title
          doc.setFontSize(20);
          doc.text(meetingNote.title, 105, 20, { align: 'center' });
          
          // Set basic info
          doc.setFontSize(12);
          let yPos = 30;
          
          doc.text(`Date: ${meetingNote.date ? new Date(meetingNote.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}`, 20, yPos);
          yPos += 7;
          
          if (meetingNote.startTime || meetingNote.endTime) {
            doc.text(`Time: ${meetingNote.startTime || ''}${meetingNote.startTime && meetingNote.endTime ? ' - ' : ''}${meetingNote.endTime || ''}`, 20, yPos);
            yPos += 7;
          }
          
          if (meetingNote.location) {
            doc.text(`Location: ${meetingNote.location}`, 20, yPos);
            yPos += 7;
          }
          
          if (meetingNote.facilitator) {
            doc.text(`Facilitator: ${meetingNote.facilitator}`, 20, yPos);
            yPos += 7;
          }
          
          if (meetingNote.notetaker) {
            doc.text(`Note Taker: ${meetingNote.notetaker}`, 20, yPos);
            yPos += 7;
          }
          
          yPos += 5;
          
          // Attendees
          if (meetingNote.attendees.length > 0) {
            doc.setFontSize(16);
            doc.text('Attendees', 20, yPos);
            yPos += 7;
            
            doc.setFontSize(12);
            meetingNote.attendees.forEach(attendee => {
              let attendeeInfo = `- ${attendee.name}`;
              if (attendee.role) attendeeInfo += `, ${attendee.role}`;
              if (attendee.email) attendeeInfo += ` (${attendee.email})`;
              
              doc.text(attendeeInfo, 20, yPos);
              yPos += 7;
            });
            
            yPos += 5;
          }
          
          // Agenda
          if (meetingNote.agenda.length > 0) {
            doc.setFontSize(16);
            doc.text('Agenda', 20, yPos);
            yPos += 7;
            
            doc.setFontSize(12);
            meetingNote.agenda.forEach((item, index) => {
              doc.text(`${index + 1}. ${item}`, 20, yPos);
              yPos += 7;
              
              // Add new page if needed
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
            });
            
            yPos += 5;
          }
          
          // Check if we need a new page
          if (yPos > 230) {
            doc.addPage();
            yPos = 20;
          }
          
          // Discussion
          if (meetingNote.discussion) {
            doc.setFontSize(16);
            doc.text('Discussion Points', 20, yPos);
            yPos += 7;
            
            doc.setFontSize(12);
            const discussionLines = doc.splitTextToSize(meetingNote.discussion, 170);
            doc.text(discussionLines, 20, yPos);
            yPos += discussionLines.length * 7 + 5;
            
            // Add new page if needed
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
          }
          
          // Decisions
          if (meetingNote.decisions) {
            doc.setFontSize(16);
            doc.text('Decisions Made', 20, yPos);
            yPos += 7;
            
            doc.setFontSize(12);
            const decisionLines = doc.splitTextToSize(meetingNote.decisions, 170);
            doc.text(decisionLines, 20, yPos);
            yPos += decisionLines.length * 7 + 5;
            
            // Add new page if needed
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
          }
          
          // Action Items
          if (meetingNote.actionItems.length > 0) {
            doc.setFontSize(16);
            doc.text('Action Items', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(12);
            meetingNote.actionItems.forEach((item, index) => {
              doc.setFont(undefined, 'bold');
              doc.text(`${index + 1}. ${item.description}`, 20, yPos);
              yPos += 7;
              
              doc.setFont(undefined, 'normal');
              doc.text(`   Assigned to: ${item.assignee}`, 20, yPos);
              yPos += 7;
              
              if (item.dueDate) {
                doc.text(`   Due date: ${new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, yPos);
                yPos += 7;
              }
              
              if (item.status) {
                doc.text(`   Status: ${item.status}`, 20, yPos);
                yPos += 7;
              }
              
              yPos += 3;
              
              // Add new page if needed
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
            });
          }
          
          // Footer
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`Meeting notes generated on ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 105, 280, { align: 'center' });
          
          // Save PDF
          doc.save(`${fileName}.pdf`);
          break;
          
        case 'html':
          // Generate HTML and download
          const htmlContent = generateHtmlNotes();
          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
          const htmlUrl = URL.createObjectURL(htmlBlob);
          const htmlLink = document.createElement('a');
          htmlLink.href = htmlUrl;
          htmlLink.download = `${fileName}.html`;
          document.body.appendChild(htmlLink);
          htmlLink.click();
          document.body.removeChild(htmlLink);
          URL.revokeObjectURL(htmlUrl);
          break;
          
        case 'markdown':
          // Generate Markdown and download
          const mdContent = generateMarkdownNotes();
          const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
          const mdUrl = URL.createObjectURL(mdBlob);
          const mdLink = document.createElement('a');
          mdLink.href = mdUrl;
          mdLink.download = `${fileName}.md`;
          document.body.appendChild(mdLink);
          mdLink.click();
          document.body.removeChild(mdLink);
          URL.revokeObjectURL(mdUrl);
          break;
          
        default:
          // Generate text and download
          const textContent = generateTextNotes();
          const textBlob = new Blob([textContent], { type: 'text/plain' });
          const textUrl = URL.createObjectURL(textBlob);
          const textLink = document.createElement('a');
          textLink.href = textUrl;
          textLink.download = `${fileName}.txt`;
          document.body.appendChild(textLink);
          textLink.click();
          document.body.removeChild(textLink);
          URL.revokeObjectURL(textUrl);
      }
      
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
      
    } catch (error) {
      console.error('Error exporting notes:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4 shadow-lg shadow-purple-500/20">
            <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Generator Notulen Rapat
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Buat notulen rapat terstruktur dengan action items dan format profesional.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8 shadow-lg shadow-purple-500/10">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            Fitur Notulen Rapat:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-purple-800 dark:text-purple-200">
            <li>Template profesional untuk berbagai jenis rapat</li>
            <li>Pelacakan action items dengan penanggung jawab dan tenggat waktu</li>
            <li>Format yang terstruktur dan mudah dibaca</li>
            <li>Ekspor ke PDF, Word, HTML, atau format lainnya</li>
            <li>Fitur berbagi via email atau link</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Meeting Details */}
          <div className="space-y-6">
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
                    placeholder="Contoh: Rapat Perencanaan Proyek Q1"
                    value={meetingNote.title}
                    onChange={(e) => updateMeetingNote('title', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={meetingNote.date}
                      onChange={(e) => updateMeetingNote('date', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lokasi / Link Meeting
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Rapat A atau Link Zoom"
                    value={meetingNote.location}
                    onChange={(e) => updateMeetingNote('location', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fasilitator
                    </label>
                    <input
                      type="text"
                      placeholder="Nama fasilitator"
                      value={meetingNote.facilitator}
                      onChange={(e) => updateMeetingNote('facilitator', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notulis
                    </label>
                    <input
                      type="text"
                      placeholder="Nama notulis"
                      value={meetingNote.notetaker}
                      onChange={(e) => updateMeetingNote('notetaker', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Peserta Rapat
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nama peserta"
                    value={newAttendee.name}
                    onChange={(e) => setNewAttendee(prev => ({ ...prev, name: e.target.value }))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Jabatan (opsional)"
                    value={newAttendee.role}
                    onChange={(e) => setNewAttendee(prev => ({ ...prev, role: e.target.value }))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email (opsional)"
                    value={newAttendee.email}
                    onChange={(e) => setNewAttendee(prev => ({ ...prev, email: e.target.value }))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button 
                  onClick={addAttendee}
                  className="w-full p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors duration-200 shadow-md shadow-purple-500/10"
                >
                  + Tambah Peserta
                </button>
                
                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                  {meetingNote.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <span className="text-gray-900 dark:text-white font-medium">{attendee.name}</span>
                        {attendee.role && <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">({attendee.role})</span>}
                        {attendee.email && <span className="text-gray-500 dark:text-gray-400 text-sm block">{attendee.email}</span>}
                      </div>
                      <button 
                        onClick={() => removeAttendee(attendee.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Agenda & Notes */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Agenda Rapat
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Item agenda"
                    value={newAgendaItem}
                    onChange={(e) => setNewAgendaItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAgendaItem()}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button 
                    onClick={addAgendaItem}
                    className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors duration-200 shadow-md shadow-purple-500/10"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                  {meetingNote.agenda.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-900 dark:text-white">{index + 1}. {item}</span>
                      <button 
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meeting Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Catatan Rapat
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Poin Diskusi
                  </label>
                  <textarea
                    placeholder="Catatan detail tentang diskusi dalam rapat..."
                    value={meetingNote.discussion}
                    onChange={(e) => updateMeetingNote('discussion', e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keputusan yang Diambil
                  </label>
                  <textarea
                    placeholder="Daftar keputusan yang diambil dalam rapat..."
                    value={meetingNote.decisions}
                    onChange={(e) => updateMeetingNote('decisions', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Action Items & Generate */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Action Items
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Deskripsi tugas"
                    value={newActionItem.description}
                    onChange={(e) => setNewActionItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Penanggung jawab"
                      value={newActionItem.assignee}
                      onChange={(e) => setNewActionItem(prev => ({ ...prev, assignee: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      placeholder="Tenggat waktu"
                      value={newActionItem.dueDate}
                      onChange={(e) => setNewActionItem(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={newActionItem.status}
                      onChange={(e) => setNewActionItem(prev => ({ ...prev, status: e.target.value as 'pending' | 'in-progress' | 'completed' }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={addActionItem}
                    className="w-full p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md shadow-purple-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Action Item</span>
                  </button>
                </div>
                
                <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
                  {meetingNote.actionItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.description}</div>
                          <div className="flex items-center space-x-3 mt-1 text-sm">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3 mr-1" />
                              <span>{item.assignee}</span>
                            </div>
                            {item.dueDate && (
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                          {item.status && (
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                item.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                  : item.status === 'in-progress'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                              }`}>
                                {item.status === 'completed' 
                                  ? 'Completed' 
                                  : item.status === 'in-progress' 
                                    ? 'In Progress' 
                                    : 'Pending'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => updateActionItemStatus(item.id, 'completed')}
                            className={`p-1 rounded ${
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                : 'text-gray-400 hover:text-green-700 dark:hover:text-green-400'
                            }`}
                            title="Mark as completed"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeActionItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Notes */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6 shadow-lg shadow-purple-500/10">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                Generate Notulen
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Format Output
                  </label>
                  <select 
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as 'pdf' | 'word' | 'html' | 'text' | 'markdown')}
                    className="w-full p-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="text">Plain Text (.txt)</option>
                    <option value="markdown">Markdown (.md)</option>
                    <option value="html">HTML (.html)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Template
                  </label>
                  <select 
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as 'standard' | 'minimal' | 'formal' | 'modern')}
                    className="w-full p-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="standard">Standar Profesional</option>
                    <option value="minimal">Minimalis</option>
                    <option value="formal">Formal</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>
                
                <button 
                  onClick={exportNotes}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
                >
                  {exportStatus === 'processing' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Generate & Unduh Notulen</span>
                    </>
                  )}
                </button>
                
                {exportStatus === 'success' && (
                  <div className="text-center text-sm text-green-600 dark:text-green-400 animate-fade-in">
                    Notulen berhasil diunduh!
                  </div>
                )}
                
                {exportStatus === 'error' && (
                  <div className="text-center text-sm text-red-600 dark:text-red-400 animate-fade-in">
                    Terjadi kesalahan saat mengekspor notulen.
                  </div>
                )}
                
                <button 
                  onClick={copyToClipboard}
                  className="w-full bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md shadow-purple-500/10"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin ke Clipboard'}</span>
                </button>
              </div>
            </div>
            
            {/* Preview */}
            <textarea
              ref={notesTextareaRef}
              value={generateTextNotes()}
              readOnly
              className="hidden"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Template Profesional</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Format standar untuk berbagai jenis rapat
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Action Items</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Pelacakan tugas dengan penanggung jawab dan deadline
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Format</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor ke PDF, HTML, Markdown, atau format lainnya
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">🔗</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Berbagi Mudah</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Bagikan notulen via email atau link
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;