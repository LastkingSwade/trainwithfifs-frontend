import React from 'react';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  score: string;
  note?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#070b10',
    color: '#e2e8f0',
    fontFamily: 'Helvetica',
  },
  borderWrapper: {
    border: '2pt solid #00E5FF',
    borderRadius: 8,
    padding: 24,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    borderBottom: '1pt solid #1e293b',
    paddingBottom: 12,
  },
  academyBadge: {
    fontSize: 9,
    color: '#00E5FF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 8,
    color: '#94a3b8',
  },
  certifySection: {
    textAlign: 'center',
    marginVertical: 12,
  },
  certifyText: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00E5FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statuteNotice: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
    marginHorizontal: 20,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0c131d',
    border: '1pt solid #1e293b',
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  gridLabel: {
    fontSize: 7,
    color: '#00E5FF',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 9,
    color: '#f1f5f9',
    fontWeight: 'bold',
  },
  noteSection: {
    backgroundColor: '#0c131d',
    borderLeft: '2pt solid #00E5FF',
    padding: 8,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 8,
    color: '#00E5FF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 8,
    color: '#cbd5e1',
    lineHeight: 1.3,
  },
  footer: {
    borderTop: '1pt solid #1e293b',
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signCol: {
    width: '45%',
  },
  signLine: {
    borderBottom: '1pt solid #64748b',
    marginBottom: 4,
    paddingBottom: 2,
  },
  signName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  signTitle: {
    fontSize: 7,
    color: '#94a3b8',
    lineHeight: 1.3,
  },
  authBadge: {
    width: '45%',
    textAlign: 'right',
  },
  authTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  authText: {
    fontSize: 7,
    color: '#64748b',
    lineHeight: 1.3,
  },
});

const CertificatePdf: React.FC<CertificateProps> = ({
  studentName,
  courseName,
  completionDate,
  certificateId,
  score,
  note,
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.borderWrapper}>
        <View style={styles.header}>
          <Text style={styles.academyBadge}>Future Initiative Firearm Services • Academy Division</Text>
          <Text style={styles.title}>Certificate of Training Completion</Text>
          <Text style={styles.subHeader}>
            Conducted under Annotated Code of Maryland, Public Safety Article § 5-101 • COMAR 29.03.02.05
          </Text>
        </View>

        <View style={styles.certifySection}>
          <Text style={styles.certifyText}>This is to officially certify that</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.courseName}>{courseName}</Text>
          <Text style={styles.statuteNotice}>
            Has successfully fulfilled all mandated classroom lecture hours, statutory legal examinations, weapons safety handling, and certified live-fire evaluation on the B-27 qualification standard administered at Cindy&apos;s Hot Shots.
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Certificate ID</Text>
            <Text style={styles.gridValue}>{certificateId}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Date Completed</Text>
            <Text style={styles.gridValue}>{completionDate}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Live-Fire Result</Text>
            <Text style={styles.gridValue}>{score}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Facility</Text>
            <Text style={styles.gridValue}>Cindy&apos;s Hot Shots (Glen Burnie, MD)</Text>
          </View>
        </View>

        {note ? (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Instructor Evaluation & Dossier Notes</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.signCol}>
            <View style={styles.signLine}>
              <Text style={styles.signName}>Kai Wade</Text>
            </View>
            <Text style={styles.signTitle}>
              Lead Firearms Instructor • MSP Qualified Handgun Instructor (§ 5-101)
            </Text>
            <Text style={styles.signTitle}>
              NRA Certified Pistol Instructor &amp; Chief Range Safety Officer (CRSO)
            </Text>
          </View>

          <View style={styles.authBadge}>
            <Text style={styles.authTitle}>Official Registry Record</Text>
            <Text style={styles.authText}>Future Initiative Firearm Services</Text>
            <Text style={styles.authText}>trainwithfifs.com • (443) 990-1304</Text>
            <Text style={styles.authText}>Registry &amp; Verification: info@trainwithfifs.com</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export async function POST(req: Request) {
  try {
const resendApiKey = process.env.RESEND_API_KEY;
    const body = await req.json().catch(() => ({}));

    const rawEmail =
      body.recipientEmail ||
      body.email ||
      body.to ||
      body.recipient_email ||
      body.recipient;

    const cleanEmail =
      typeof rawEmail === 'string' && rawEmail.trim()
        ? rawEmail.trim()
        : 'carpetcare85@gmail.com';

    const studentName =
      body.recipientName ||
      body.studentName ||
      body.name ||
      'Kai Wade';

    const courseName =
      body.courseName ||
      'Maryland Wear & Carry Initial Certification (16-Hour) & HQL';

    const score = body.score || '100% Qualified (25/25 B-27)';
    const note = body.note || body.message || body.notes || '';

    const today = new Date().toISOString().split('T')[0];
    const certificateId = `FI-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Generate Personalized Certificate PDF
    const certPdfBuffer = await renderToBuffer(
      <CertificatePdf
        studentName={studentName}
        courseName={courseName}
        completionDate={today}
        certificateId={certificateId}
        score={score}
        note={note}
      />
    );

    // 2. Prepare Attachments List (Certificate + Pre-made Packets from Desktop)
    const emailAttachments: Array<{ filename: string; content: Buffer }> = [
      {
        filename: `${studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Official_Certificate.pdf`,
        content: Buffer.from(certPdfBuffer),
      },
    ];

    const waiverPath = '/Users/swade/Desktop/my-app/public/packets/Range_Safety_Waiver_and_Travel_Briefing.pdf';
    const affidavitPath = '/Users/swade/Desktop/my-app/public/packets/Multi_State_Affidavits_FL_VA_AZ.pdf';

    if (fs.existsSync(waiverPath)) {
      emailAttachments.push({
        filename: 'FIFS_Range_Safety_Waiver_and_Travel_Briefing.pdf',
        content: fs.readFileSync(waiverPath),
      });
    }

    if (fs.existsSync(affidavitPath)) {
      emailAttachments.push({
        filename: 'FIFS_Multi_State_Affidavits_FL_VA_AZ.pdf',
        content: fs.readFileSync(affidavitPath),
      });
    }

    // 3. Send Email via Resend
      resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'onboarding@resend.dev';

    const { data, error: resendError } = await resend.emails.send({
      from: fromAddress,
      to: [cleanEmail],
      subject: `Official Training Completion Documents - ${studentName}`,
      text: `Hello ${studentName},\n\nCongratulations on completing your training with Future Initiative Firearm Services.\n\nAttached to this email you will find:\n1. Your Official Certificate of Training Completion (${certificateId})\n2. Range Safety Waiver & Safe-Harbor Travel Briefing Packet\n3. Multi-State Carry Compliance Affidavits\n\nLead Instructor: Kai Wade\nMSP Qualified Handgun Instructor (§ 5-101)\nNRA Certified Pistol & Chief RSO\ntrainwithfifs.com | (443) 990-1304`,
      attachments: emailAttachments,
    });

    if (resendError) {
      console.error('Resend delivery error:', resendError);
      return NextResponse.json({ error: resendError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, certificateId, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending document:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send document' },
      { status: 500 }
    );
  }
}
