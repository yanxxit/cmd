import forge from 'node-forge';
const { pki } = forge;
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), '.http-sniffer');
const CERT_DIR = path.join(LOG_DIR, 'certs');

let rootCACert = null;
let rootCAKey = null;

function ensureDirs() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }
}

function loadRootCA() {
  const certPath = path.join(CERT_DIR, 'root-ca.pem');
  const keyPath = path.join(CERT_DIR, 'root-ca-key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const certPem = fs.readFileSync(certPath, 'utf8');
    const keyPem = fs.readFileSync(keyPath, 'utf8');
    rootCACert = pki.certificateFromPem(certPem);
    rootCAKey = pki.privateKeyFromPem(keyPem);
    return { cert: certPem, key: keyPem };
  }
  return null;
}

function createRootCA() {
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10);
  
  const attrs = [
    { name: 'commonName', value: 'HTTP Sniffer CA' },
    { name: 'organizationName', value: 'HTTP Sniffer' },
    { shortName: 'OU', value: 'Development' }
  ];
  
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'subjectKeyIdentifier'
    }
  ]);
  
  cert.sign(keys.privateKey);
  
  const certPem = pki.certificateToPem(cert);
  const keyPem = pki.privateKeyToPem(keys.privateKey);
  
  fs.writeFileSync(path.join(CERT_DIR, 'root-ca.pem'), certPem);
  fs.writeFileSync(path.join(CERT_DIR, 'root-ca-key.pem'), keyPem);
  
  rootCACert = cert;
  rootCAKey = keys.privateKey;
  
  return { cert: certPem, key: keyPem };
}

export async function createCertificate(hostname, isRoot = false) {
  ensureDirs();
  
  if (isRoot) {
    let rootCA = loadRootCA();
    if (!rootCA) {
      rootCA = createRootCA();
    }
    return rootCA;
  }
  
  if (!rootCACert || !rootCAKey) {
    let rootCA = loadRootCA();
    if (!rootCA) {
      rootCA = createRootCA();
    }
  }
  
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  
  cert.publicKey = keys.publicKey;
  cert.serialNumber = Date.now().toString(16);
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 2);
  
  const attrs = [
    { name: 'commonName', value: hostname },
    { name: 'organizationName', value: 'HTTP Sniffer' }
  ];
  
  cert.setSubject(attrs);
  cert.setIssuer(rootCACert.subject.attributes);
  
  const altNames = [
    { type: 2, value: hostname },
    { type: 2, value: `*.${hostname}` }
  ];
  
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false
    },
    {
      name: 'keyUsage',
      digitalSignature: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true
    },
    {
      name: 'subjectAltName',
      altNames: altNames
    },
    {
      name: 'subjectKeyIdentifier'
    }
  ]);
  
  cert.sign(rootCAKey);
  
  const certPem = pki.certificateToPem(cert);
  const keyPem = pki.privateKeyToPem(keys.privateKey);
  
  return { cert: certPem, key: keyPem };
}
