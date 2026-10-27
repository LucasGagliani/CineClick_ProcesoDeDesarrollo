package com.cineclick.security;

import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.regex.Pattern;

/** Hash con sal aleatoria, sin almacenar ni recuperar la contraseña original. */
@Component
public class PasswordService {
    private static final int ITERACIONES = 600_000;
    private static final String PREFIJO = "pbkdf2-sha256$" + ITERACIONES + "$";
    private static final Pattern FORMATO = Pattern.compile(
        Pattern.quote(PREFIJO) + "[A-Za-z0-9_-]{22}\\$[A-Za-z0-9_-]{43}");
    private final SecureRandom random = new SecureRandom();

    public String codificar(String password) {
        byte[] sal = new byte[16];
        random.nextBytes(sal);
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        return PREFIJO + encoder.encodeToString(sal) + "$" + encoder.encodeToString(derivar(password, sal));
    }

    public boolean esHash(String valor) {
        return valor != null && FORMATO.matcher(valor).matches();
    }

    public boolean coincide(String password, String hash) {
        if (password == null || !esHash(hash)) {
            return false;
        }
        String[] partes = hash.split("\\$");
        Base64.Decoder decoder = Base64.getUrlDecoder();
        return MessageDigest.isEqual(decoder.decode(partes[3]), derivar(password, decoder.decode(partes[2])));
    }

    private byte[] derivar(String password, byte[] sal) {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), sal, ITERACIONES, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("No se pudo procesar la contraseña", ex);
        } finally {
            spec.clearPassword();
        }
    }
}
