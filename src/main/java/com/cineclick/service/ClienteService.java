package com.cineclick.service;

import com.cineclick.dto.ClienteRequestDTO;
import com.cineclick.dto.ClientePerfilRequestDTO;
import com.cineclick.dto.CambiarPasswordRequestDTO;
import com.cineclick.dto.ClienteResponseDTO;
import com.cineclick.mapper.ClienteMapper;
import com.cineclick.exception.RecursoNoEncontradoException;
import com.cineclick.exception.RecursoDuplicadoException;
import com.cineclick.exception.CredencialesInvalidasException;
import com.cineclick.model.Cliente;
import com.cineclick.model.RolUsuario;
import com.cineclick.model.Usuario;
import com.cineclick.repository.ClienteRepository;
import com.cineclick.repository.UsuarioRepository;
import com.cineclick.security.PasswordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordService passwords;

    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> listar() {
        return clienteRepository.findAll().stream().map(ClienteMapper::toClienteResponse).toList();
    }

    @Transactional
    public ClienteResponseDTO registrar(ClienteRequestDTO dto) {
        validarEmailUnico(dto.email());
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.nombre());
        usuario.setApellido(dto.apellido());
        usuario.setEmail(dto.email());
        usuario.setPassword(passwords.codificar(dto.password()));
        usuario.setRol(RolUsuario.CLIENTE);

        Cliente cliente = new Cliente();
        cliente.setUsuario(usuario);
        cliente.setTelefono(dto.telefono());
        return ClienteMapper.toClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional(readOnly = true)
    public ClienteResponseDTO buscarPorId(Long id) {
        return ClienteMapper.toClienteResponse(buscarEntidad(id));
    }

    @Transactional
    public ClienteResponseDTO actualizar(Long id, ClientePerfilRequestDTO dto) {
        Cliente cliente = buscarEntidad(id);
        if (!cliente.getUsuario().getEmail().equalsIgnoreCase(dto.email())) {
            validarEmailUnico(dto.email());
        }
        cliente.getUsuario().setNombre(dto.nombre());
        cliente.getUsuario().setApellido(dto.apellido());
        cliente.getUsuario().setEmail(dto.email());
        cliente.setTelefono(dto.telefono());
        return ClienteMapper.toClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void cambiarPassword(Long id, CambiarPasswordRequestDTO dto) {
        Cliente cliente = buscarEntidad(id);
        Usuario usuario = cliente.getUsuario();
        if (!usuario.isActivo() || !passwords.coincide(dto.passwordActual(), usuario.getPassword())) {
            throw new CredencialesInvalidasException("La contraseña actual no es correcta o el usuario esta inactivo");
        }
        usuario.setPassword(passwords.codificar(dto.passwordNueva()));
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = buscarEntidad(id);
        cliente.desactivar();
        clienteRepository.save(cliente);
    }

    @Transactional(readOnly = true)
    public Cliente buscarEntidad(Long id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id " + id));
    }

    public void validarEmailUnico(String email) {
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RecursoDuplicadoException("Ya existe un usuario registrado con el email " + email);
        }
    }
}
