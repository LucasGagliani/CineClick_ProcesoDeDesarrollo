package com.cineclick.config;

import com.cineclick.repository.UsuarioRepository;
import com.cineclick.security.PasswordService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Convierte los registros de la version anterior sin cambiar sus credenciales. */
@Component
@Order(-10)
@RequiredArgsConstructor
public class PasswordMigration implements ApplicationRunner {
    private final UsuarioRepository usuarios;
    private final PasswordService passwords;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        usuarios.findAll().stream().filter(u -> !passwords.esHash(u.getPassword()))
            .forEach(u -> u.setPassword(passwords.codificar(u.getPassword())));
    }
}
