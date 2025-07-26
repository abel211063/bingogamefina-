import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#333333' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: '#1a202c' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 8, borderBottom: '1.5pt solid #e2e8f0', paddingBottom: 4, color: '#2d3748' },
  infoText: { marginBottom: 3 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f7fafc', padding: 6, fontFamily: 'Helvetica-Bold' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  winnerRow: { backgroundColor: '#c6f6d5' },
  statusCell: { fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: 'grey', fontSize: 8 }
});

const BingoReport = ({ gameState }) => (
  <Document title={`Bingo Report - ${gameState.gameId}`} author="Bingo Clone App">
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Bingo Game Report</Text>
        <Text style={styles.infoText}>Game ID: {gameState.gameId}</Text>
        <Text style={styles.infoText}>Status: {gameState.isActive ? 'Active' : 'Game Over'}</Text>
        {gameState.lastWinner && <Text style={styles.infoText}>Winner: {gameState.lastWinner}</Text>}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bet History</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text>Ticket ID</Text></View>
            <View style={styles.tableColHeader}><Text>Player Name</Text></View>
            <View style={styles.tableColHeader}><Text>Bet Amount</Text></View>
            <View style={styles.tableColHeader}><Text>Status</Text></View>
          </View>
          {gameState.bets.map((bet) => (
            <View key={bet.ticketId} style={[styles.tableRow, bet.status === 'Winner' && styles.winnerRow]}>
              <View style={styles.tableCol}><Text>{bet.ticketId}</Text></View>
              <View style={styles.tableCol}><Text>{bet.playerName}</Text></View>
              <View style={styles.tableCol}><Text>${bet.amount.toLocaleString()}</Text></View>
              <View style={styles.tableCol}><Text style={styles.statusCell}>{bet.status}</Text></View>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.footer}>Generated on {new Date().toLocaleString()}</Text>
    </Page>
  </Document>
);

export default BingoReport;