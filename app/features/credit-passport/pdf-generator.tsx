import React from 'react'
import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer'
import type {
    AssetMetrics,
    CreditScoreMetrics,
    FinancialMetrics,
    OperationalMetrics,
    ReportBranding,
    ReportLanguage,
    ReportMetrics,
    ReportType,
    TrackRecordMetrics,
} from './types'

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    section: { marginBottom: 15 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    qrCode: { width: 50, height: 50 },
})

interface CreditPassportPDFProps {
    reportType: ReportType
    metrics: ReportMetrics
    branding: ReportBranding
    qrCodeDataUrl: string
    language: ReportLanguage
}

const ReportHeader: React.FC<{
    branding: ReportBranding
    title: string
    dates: string
}> = ({ branding, title, dates }) => (
    <View style={styles.header}>
        <View>
            <Text style={styles.title}>{title}</Text>
            <Text>{dates}</Text>
        </View>
        {branding === 'openlivestock' && <Text>OpenLivestock</Text>}
    </View>
)

const VerificationFooter: React.FC<{ qrCodeDataUrl: string }> = ({
    qrCodeDataUrl,
}) => (
    <View style={styles.footer}>
        <Text>Digitally signed and verified</Text>
        <Image src={qrCodeDataUrl} style={styles.qrCode} />
    </View>
)

const FinancialSection: React.FC<{ metrics: FinancialMetrics }> = ({
    metrics,
}) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Performance</Text>
        <View style={styles.row}>
            <Text>Total Revenue:</Text>
            <Text>{metrics.totalRevenue}</Text>
        </View>
        <View style={styles.row}>
            <Text>Net Profit:</Text>
            <Text>{metrics.profit}</Text>
        </View>
        <View style={styles.row}>
            <Text>Profit Margin:</Text>
            <Text>{metrics.profitMargin}%</Text>
        </View>
    </View>
)

const OperationalSection: React.FC<{ metrics: OperationalMetrics }> = ({
    metrics,
}) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operational Metrics</Text>
        <View style={styles.row}>
            <Text>Active Batches:</Text>
            <Text>{metrics.batchCount}</Text>
        </View>
        <View style={styles.row}>
            <Text>Avg FCR:</Text>
            <Text>{metrics.avgFCR ?? 'N/A'}</Text>
        </View>
        <View style={styles.row}>
            <Text>Mortality Rate:</Text>
            <Text>{metrics.avgMortalityRate}%</Text>
        </View>
    </View>
)

const AssetSection: React.FC<{ metrics: AssetMetrics }> = ({ metrics }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assets</Text>
        <View style={styles.row}>
            <Text>Total Inventory Value:</Text>
            <Text>{metrics.totalInventoryValue}</Text>
        </View>
        <View style={styles.row}>
            <Text>Total Livestock:</Text>
            <Text>{metrics.totalLivestock}</Text>
        </View>
    </View>
)

const TrackRecordSection: React.FC<{ metrics: TrackRecordMetrics }> = ({
    metrics,
}) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Track Record</Text>
        <View style={styles.row}>
            <Text>Completed Batches:</Text>
            <Text>{metrics.batchesCompleted}</Text>
        </View>
        <View style={styles.row}>
            <Text>Success Rate:</Text>
            <Text>{metrics.successRate}%</Text>
        </View>
    </View>
)

const CreditScoreSection: React.FC<{ metrics: CreditScoreMetrics }> = ({
    metrics,
}) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Score</Text>
        <View style={styles.row}>
            <Text>Score:</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                {metrics.score}/100
            </Text>
        </View>
        <View style={styles.row}>
            <Text>Rating:</Text>
            <Text>{metrics.grade}</Text>
        </View>
    </View>
)

const ProductionVolumeSection: React.FC<{ metrics: TrackRecordMetrics }> = ({
    metrics,
}) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Production Volume</Text>
        <View style={styles.row}>
            <Text>Production Volume:</Text>
            <Text>{metrics.productionVolume}</Text>
        </View>
    </View>
)

export const CreditPassportPDF: React.FC<CreditPassportPDFProps> = ({
    reportType,
    metrics,
    branding,
    qrCodeDataUrl,
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader
                branding={branding}
                title="Credit Passport Report"
                dates="Report Period"
            />

            <CreditScoreSection metrics={metrics.creditScore} />
            <FinancialSection metrics={metrics.financial} />
            <OperationalSection metrics={metrics.operational} />

            {reportType !== 'credit_assessment' && (
                <>
                    <AssetSection metrics={metrics.assets} />
                    <TrackRecordSection metrics={metrics.trackRecord} />
                    <ProductionVolumeSection metrics={metrics.trackRecord} />
                </>
            )}

            <VerificationFooter qrCodeDataUrl={qrCodeDataUrl} />
        </Page>
    </Document>
)
