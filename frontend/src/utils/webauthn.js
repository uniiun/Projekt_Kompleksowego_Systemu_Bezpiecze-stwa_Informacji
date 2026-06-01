export const base64urlToBuffer = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const bufferToBase64url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const mapRegistrationOptions = (options) => ({
  ...options,
  challenge: base64urlToBuffer(options.challenge),
  user: {
    ...options.user,
    id: base64urlToBuffer(options.user.id),
  },
  excludeCredentials: options.excludeCredentials
    ? options.excludeCredentials.map((cred) => ({
        ...cred,
        id: base64urlToBuffer(cred.id),
      }))
    : undefined,
});

export const mapAuthenticationOptions = (options) => ({
  ...options,
  challenge: base64urlToBuffer(options.challenge),
  allowCredentials: options.allowCredentials
    ? options.allowCredentials.map((cred) => ({
        ...cred,
        id: base64urlToBuffer(cred.id),
      }))
    : undefined,
});

export const serializeRegistrationCredential = (credential) => ({
  id: credential.id,
  rawId: bufferToBase64url(credential.rawId),
  type: credential.type,
  response: {
    attestationObject: bufferToBase64url(credential.response.attestationObject),
    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
  },
  transports: credential.response.getTransports ? credential.response.getTransports() : [],
});

export const serializeAuthenticationCredential = (credential) => ({
  id: credential.id,
  rawId: bufferToBase64url(credential.rawId),
  type: credential.type,
  response: {
    authenticatorData: bufferToBase64url(credential.response.authenticatorData),
    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
    signature: bufferToBase64url(credential.response.signature),
    userHandle: credential.response.userHandle
      ? bufferToBase64url(credential.response.userHandle)
      : null,
  },
});
