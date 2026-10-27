package com.cineclick;

import com.cineclick.exception.ReglaNegocioException;
import com.cineclick.model.Sala;
import com.cineclick.model.SalaFactory;
import com.cineclick.model.TipoButaca;
import com.cineclick.model.TipoSala;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class SalaFactoryTests {
    @Test
    void generaUnaDistribucionCompletaConReferenciasYTiposCorrectos() {
        Sala sala = SalaFactory.crear("Premium", 3, TipoSala.PREMIUM, 26, 4);
        assertThat(sala.capacidad()).isEqualTo(104);
        assertThat(sala.getButacas()).allSatisfy(b -> {
            assertThat(b.getSala()).isSameAs(sala);
            assertThat(b.getTipo()).isEqualTo(b.getNumero() <= 2 ? TipoButaca.VIP : TipoButaca.NORMAL);
        });
        assertThat(sala.getButacas()).extracting(b -> b.codigo()).doesNotHaveDuplicates()
            .contains("A1", "Z4");
        assertThat(SalaFactory.crear("Chica", 1, TipoSala.TRADICIONAL, 1, 1).capacidad()).isEqualTo(1);
    }

    @Test
    void rechazaDimensionesQueNoPuedeRepresentarSinCrearSalasParciales() {
        assertThatThrownBy(() -> SalaFactory.crear("Sala", 1, TipoSala.IMAX, 27, 4))
            .isInstanceOf(ReglaNegocioException.class);
        assertThatThrownBy(() -> SalaFactory.crear("Sala", 1, TipoSala.IMAX, 0, 4))
            .isInstanceOf(ReglaNegocioException.class);
        assertThatThrownBy(() -> SalaFactory.crear("Sala", 1, TipoSala.IMAX, 1, 0))
            .isInstanceOf(ReglaNegocioException.class);
    }
}
