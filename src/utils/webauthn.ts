// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Utilitaires WebAuthn optimisés pour IBEX
 * Conformes aux standards FIDO2 et WebAuthn
 */

/**
 * Convertit un challenge en ArrayBuffer pour WebAuthn
 */
export function challengeToArrayBuffer(challenge: any): ArrayBuffer {
  if (challenge instanceof ArrayBuffer) return challenge;
  if (challenge instanceof Uint8Array) return challenge.buffer as ArrayBuffer;

  if (typeof challenge === 'string') {
    const cleanChallenge = challenge.trim();

    // Essayer base64 standard puis base64url
    try {
      const binaryString = atob(cleanChallenge);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch {
      try {
        const base64 = cleanChallenge.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      } catch {
        // Fallback UTF-8
        return new TextEncoder().encode(cleanChallenge).buffer;
      }
    }
  }

  return new ArrayBuffer(32);
}

/**
 * Prépare les options WebAuthn pour l'inscription
 */
export function prepareWebAuthnRegistrationOptions(options: any): any {
  const prepared = { ...options };

  // Convertir le challenge
  if (prepared.challenge) {
    prepared.challenge = challengeToArrayBuffer(prepared.challenge);
  }

  // Convertir l'ID utilisateur
  if (prepared.user?.id) {
    prepared.user.id = challengeToArrayBuffer(prepared.user.id);
  }

  // Ajouter les algorithmes supportés
  if (!prepared.pubKeyCredParams || prepared.pubKeyCredParams.length === 0) {
    prepared.pubKeyCredParams = [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ];
  }

  // Configurer l'attestation
  if (prepared.attestation === undefined) {
    prepared.attestation = 'direct';
  }

  // Configurer l'authentificateur
  if (!prepared.authenticatorSelection) {
    prepared.authenticatorSelection = {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    };
  }

  // Timeout pour l'inscription
  if (!prepared.timeout) {
    prepared.timeout = 60000; // 60 secondes
  }

  return prepared;
}

/**
 * Prépare les options WebAuthn pour l'authentification
 */
export function prepareWebAuthnAuthenticationOptions(options: any): any {
  const prepared = { ...options };

  // Convertir le challenge
  if (prepared.challenge) {
    prepared.challenge = challengeToArrayBuffer(prepared.challenge);
  }

  // Convertir les allowCredentials
  if (prepared.allowCredentials?.length) {
    prepared.allowCredentials = prepared.allowCredentials
      .filter((cred: any) => cred && cred.id)
      .map((cred: any) => ({
        ...cred,
        id: challengeToArrayBuffer(cred.id),
      }));
  } else {
    delete prepared.allowCredentials;
  }

  // Timeout pour l'authentification
  if (!prepared.timeout) {
    prepared.timeout = 30000; // 30 secondes
  }

  // Validation finale
  if (!prepared.challenge) {
    throw new Error("Challenge manquant pour l'authentification WebAuthn");
  }

  if (!prepared.rpId) {
    throw new Error("rpId manquant pour l'authentification WebAuthn");
  }

  return prepared;
}
