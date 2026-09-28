import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import RubberStamp from '../../components/RubberStamp';
import { categoryLabels } from '../../constants/categories';
import { CURRENT_USER_NAME } from '../../constants/currentUser';
import { severityLabels, statusLabels } from '../../constants/status';
import { confirmReport, getNeighborhoodRank, getReportById } from '../../data/reports';
import { CONFIRMATIONS_TO_ESCALATE, CONFIRMATIONS_TO_VALIDATE, isUrgent } from '../../types/report';
import { colors, fonts, fontSizes, spacing } from '../../theme';

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Screen 03 of the mockup (design/figma/03-detalle.png).
export default function ReportDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const report = getReportById(id);

  // Local-only guard: Sprint 1 has no backend, so "ya confirmé este reclamo" only
  // lasts for the current app session, not across restarts.
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [following, setFollowing] = useState(false);

  if (!report) {
    return <EmptyState message="Este reclamo no existe o fue eliminado." />;
  }

  const urgent = isUrgent(report);
  const isOwnReport = report.authorName === CURRENT_USER_NAME;
  const canConfirm = !isOwnReport && !justConfirmed;
  const rank = getNeighborhoodRank(report);

  const reportId = report.id;
  function handleConfirm() {
    const updated = confirmReport(reportId);
    if (updated) setJustConfirmed(true);
  }

  const nextThreshold =
    report.status === 'Reported'
      ? CONFIRMATIONS_TO_VALIDATE
      : report.status === 'Validated'
        ? CONFIRMATIONS_TO_ESCALATE
        : null;
  const nextThresholdLabel =
    report.status === 'Reported' ? 'a validarse' : 'a elevarse a la comuna';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.navText}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.navText}>Reclamo · {report.caseNumber}</Text>
      </View>

      <View style={styles.photoWrap}>
        <Image source={{ uri: report.photoUrl }} style={styles.photo} resizeMode="cover" />
        <Text style={styles.tagline}>
          Foto del vecino · {formatDateTime(report.createdAt)}
        </Text>
        {report.severity === 'High' && (
          <View style={styles.severityBadge}>
            <Text style={styles.severityBadgeText}>Severidad alta</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.category}>
          ● {categoryLabels[report.category]} · Severidad {severityLabels[report.severity].toLowerCase()}
          {urgent ? ' · Urgente' : ''}
        </Text>
        <Text style={styles.title}>{categoryLabels[report.category]}</Text>
        <Text style={styles.address}>{report.address ?? 'Dirección sin resolver'}</Text>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Confirmaron</Text>
            <Text style={styles.statValue}>{report.confirmations}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Días abierto</Text>
            <Text style={styles.statValue}>{daysSince(report.createdAt)}</Text>
          </View>
          {rank && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Del barrio</Text>
              <Text style={styles.statValue}>{rank}°</Text>
            </View>
          )}
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Coordenadas</Text>
            <Text style={styles.metaValue}>
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              {report.accuracyMeters ? ` · ±${Math.round(report.accuracyMeters)} m` : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Reportado</Text>
            <Text style={styles.metaValue}>{formatDateTime(report.createdAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Estado</Text>
            <Text style={styles.metaValue}>{statusLabels[report.status].toUpperCase()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>N° expediente</Text>
            <Text style={styles.metaValue}>{report.caseNumber}</Text>
          </View>
          {report.crewName && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Cuadrilla</Text>
              <Text style={styles.metaValue}>{report.crewName}</Text>
            </View>
          )}
        </View>

        <View style={styles.stampRow}>
          <RubberStamp
            size={110}
            color={urgent ? colors.rust : colors.green}
            curvedText="RECLAMO · VECINAL ·"
            centerLines={[statusLabels[report.status].toUpperCase(), formatDateTime(report.createdAt).split(',')[0]]}
          />
          {nextThreshold !== null && (
            <View style={styles.progress}>
              <Text style={styles.progressText}>
                Con {nextThreshold} confirmaciones el expediente pasa {nextThresholdLabel}.
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (report.confirmations / nextThreshold) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressCount}>
                {report.confirmations} / {nextThreshold}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Timeline de expediente</Text>
        {report.history.map((entry, index) => (
          <View key={index} style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: statusColorFor(entry.status) }]} />
            <Text style={styles.timelineText}>
              {formatDateTime(entry.createdAt)} — {entry.description}
            </Text>
          </View>
        ))}

        <Pressable
          disabled={!canConfirm}
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            !canConfirm && styles.confirmButtonDisabled,
            pressed && canConfirm && styles.pressed,
          ]}
        >
          <Text style={styles.confirmButtonText}>
            {isOwnReport
              ? 'No podés confirmar tu propio reclamo'
              : justConfirmed
                ? '✓ Ya confirmaste este reclamo'
                : '+ Confirmar que sigue ahí'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFollowing((prev) => !prev)}
          style={({ pressed }) => [styles.followButton, pressed && styles.pressed]}
        >
          <Text style={styles.followButtonText}>{following ? 'Siguiendo ✓' : 'Seguir'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function statusColorFor(status: string): string {
  switch (status) {
    case 'Resolved':
      return colors.green;
    case 'InProgress':
      return colors.blue;
    case 'Escalated':
      return colors.rust;
    default:
      return colors.yellow;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  navText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
  photoWrap: {
    height: 190,
    backgroundColor: colors.asphalt2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    color: colors.chalk,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
  },
  severityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.rust,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  severityBadgeText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
  body: {
    padding: spacing.lg,
  },
  category: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.rust,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
    marginBottom: 4,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
    marginBottom: spacing.lg,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    padding: spacing.sm,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.asphalt,
  },
  metaBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.concrete,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metaKey: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
  metaValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progress: {
    flex: 1,
    gap: 4,
  },
  progressText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.asphalt,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.chalk2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.yellow,
  },
  progressCount: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginBottom: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  timelineDot: {
    width: 12,
    height: 12,
  },
  timelineText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  confirmButton: {
    backgroundColor: colors.asphalt,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.concreteLight,
  },
  pressed: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
  followButton: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  followButtonText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
});
