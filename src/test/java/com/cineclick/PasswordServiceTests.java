package com.cineclick;

import com.cineclick.security.PasswordService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordServiceTests {
    private final PasswordService passwords = new PasswordService();

    @Test
    void usaSalAleatoriaYVerificaTodaLaPasswordIncluyendoUnicode() {
        String password = "ñ".repeat(120);
        String a = passwords.codificar(password);
        String b = passwords.codificar(password);
        assertThat(a).isNotEqualTo(b).hasSizeLessThanOrEqualTo(120);
        assertThat(passwords.coincide(password, a)).isTrue();
        assertThat(passwords.coincide(password.substring(1), a)).isFalse();
        assertThat(passwords.coincide("incorrecta", a)).isFalse();
    }

    @Test
    void noAceptaTextoPlanoNiHashesMalFormadosComoCredencialesAlmacenadas() {
        assertThat(passwords.coincide("1234", "1234")).isFalse();
        assertThat(passwords.coincide("1234", "pbkdf2-sha256$600000$corrupto")).isFalse();
        assertThat(passwords.coincide(null, null)).isFalse();
    }
}
