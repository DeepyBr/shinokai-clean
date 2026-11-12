import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/context/AppContext';
import { Colors, Fonts } from '../src/theme/colors';

export default function TvScannerScreen() {
  const router = useRouter();
  const { connectTvWithCode, user } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [pairedDevice, setPairedDevice] = useState<string | null>(
    user.connectedTvName || null
  );
  const [scanningLocked, setScanningLocked] = useState(false);

  const handlePairCode = async (rawCode: string) => {
    if (!rawCode.trim() || scanningLocked) return;
    setScanningLocked(true);
    const match = rawCode.match(/code=([A-Za-z0-9_-]{1,16})/);
    const clean = match ? match[1] : rawCode.trim();
    const res = await connectTvWithCode(clean);
    if (res.ok) {
      setPairedDevice(res.deviceName);
    }
    setScanningLocked(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Conectar Smart TV</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Abra o aplicativo Shinokai na sua Smart TV e escaneie o QR Code exibido na tela ou
          digite o código de acesso abaixo:
        </Text>

        {/* Camera QR Scanner Box */}
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (data) handlePairCode(data);
              }}
            />
          ) : (
            <View style={styles.permissionFallback}>
              <Ionicons name="qr-code-outline" size={56} color={Colors.primaryAccent} />
              <Text style={styles.permTitle}>Acesso à Câmera</Text>
              <Text style={styles.permSub}>
                Precisamos da câmera para ler o QR Code e conectar sua TV.
              </Text>
              <Pressable style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Permitir Câmera</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.cornerFrame} pointerEvents="none" />
        </View>

        {/* Manual Code Entry */}
        <Text style={styles.orLabel}>OU DIGITE O CÓDIGO DA TV</Text>
        <View style={styles.codeRow}>
          <TextInput
            style={styles.codeInput}
            placeholder="Ex: SK-8492"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            value={manualCode}
            onChangeText={setManualCode}
          />
          <Pressable
            style={styles.pairBtn}
            onPress={() => handlePairCode(manualCode)}
          >
            <Text style={styles.pairBtnText}>Conectar</Text>
          </Pressable>
        </View>

        {pairedDevice && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>TV Conectada com Sucesso!</Text>
              <Text style={styles.successSub}>{pairedDevice}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  instructions: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 19,
  },
  cameraContainer: {
    height: 255,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginTop: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  permissionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 10,
  },
  permSub: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  permBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  permBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  cornerFrame: {
    position: 'absolute',
    top: 32,
    bottom: 32,
    left: 48,
    right: 48,
    borderWidth: 2,
    borderColor: 'rgba(226, 18, 33, 0.65)',
    borderRadius: 14,
  },
  orLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 1.2,
  },
  pairBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  successTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  successSub: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
});
