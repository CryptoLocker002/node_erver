"use strict";


class TerminalPersonalizada extends Terminal {
    constructor() {
        super({
            cursorBlink: true,
            cols: 120,
            rows: 80,
        });
        this.currentLine = [];
        this.on("paste", this.onPaste);
        this.on("key", this.onKey);
        this.loggedIn = true;
        this.formularioLoginVisible = false;
        this.usuario = '';
        this.contrasena = '';
        this.prompt();
    }

    prompt() {
        this.write(this.loggedIn ? `\r\n${this.usuario} $ ` : '\r\n $ ');
    }

    onPaste(data, ev) {
        this.write(data);
    }
    onKey(key, ev) {
      const teclas = { enter: 13, retroceso: 8 };
      const imprimible = !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey;
  
      if (!this.loggedIn) {
          if (ev.keyCode === teclas.enter && this.currentLine.join('') === 'login') {
              this.formularioLoginVisible = true;
              this.write('\r\nNombre de usuario: ');
              this.currentLine = [];
          } else if (this.formularioLoginVisible) {
              if (ev.keyCode === teclas.enter) {
                  if (this.currentLine.length === 0) {
                      this.writeln('El nombre de usuario no puede estar vacío. Por favor, inténtalo de nuevo.');
                  } else if (!this.usuario) {
                      this.usuario = this.currentLine.join('');
                      this.write('\r\nContraseña: ');
                      this.currentLine = [];
                  } else {
                      this.contrasena = this.currentLine.join('');
                      this.login(this.usuario, this.contrasena);
                  }
              } else if (ev.keyCode === teclas.retroceso) {
                  if (this.currentLine.length > 0) {
                      this.currentLine.pop();
                      this.write("\b \b");
                  }
              } else if (imprimible) {
                  this.currentLine.push(key);
                  this.write(key);
              }
          } else if (ev.keyCode === teclas.enter) {
              this.manejarComando(this.currentLine.join(''));
              this.currentLine = []; // Limpiar la línea actual después de procesar el comando.
          } else if (ev.keyCode === teclas.retroceso) {
              if (this.currentLine.length > 0) {
                  this.currentLine.pop();
                  this.write("\b \b");
              }
          } else if (imprimible) {
              this.currentLine.push(key);
              this.write(key);
          }
      } else {
          if (ev.keyCode === teclas.enter) {
              this.manejarComando(this.currentLine.join(''));
              this.currentLine = []; // Limpiar la línea actual después de procesar el comando.
          } else if (ev.keyCode === teclas.retroceso) {
              if (this.currentLine.length > 0) {
                  this.currentLine.pop();
                  this.write("\b \b");
              }
          } else if (imprimible) {
              this.currentLine.push(key);
              this.write(key);
          }
      }
  }
  

login(username, password) {
    console.log('Enviando solicitud de inicio de sesión:', username, password);
  
    fetch('/logi', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Inicio de sesión exitoso') {
            this.loggedIn = true;
            this.usuario = username;
            this.writeln('\r\nInicio de sesión exitoso.');
            this.prompt();
        } else {
            this.writeln('\r\nCredenciales incorrectas. Por favor, inténtalo de nuevo.');
            this.prompt();
        }
    })
    .catch(error => {
        console.error('Error en la solicitud de inicio de sesión:', error);
    });
  }
  

  manejarComando(comando) {
    const comandos = comando.split(' '); // Dividir el comando en palabras
    const primerComando = comandos[0];

    if (primerComando === 'clear') {
        this.clearScreen();
        this.prompt();
        return;
    }

    if (primerComando === 'help') {
        this.writeln('\r\nComandos disponibles:');
        this.writeln('- login: Iniciar sesión con tu nombre de usuario y contraseña.');
        this.writeln('- clear: Limpiar la pantalla.');
        this.prompt();
        return;
    }

    if (this.loggedIn) {
        // Si el usuario ya está autenticado, procesa los comandos
        switch (primerComando) {
            case 'logout':
                this.loggedIn = false;
                this.usuario = '';
                this.contrasena = '';
                this.writeln('\r\nCerró la sesión. Por favor, inicie sesión nuevamente para continuar.');
                break;
            default:
                this.writeln(`\r\nComando no reconocido: ${primerComando}`);
        }
    } else {
        switch (primerComando) {
            case 'login':
                if (comandos.length === 1) {
                    // Si el usuario no está autenticado y se ingresa "login" como el único comando
                    this.formularioLoginVisible = true;
                    this.write('\r\nNombre de usuario: ');
                } else {
                    this.writeln(`\r\nComando no reconocido: ${primerComando}`);
                }
                break;
            default:
                this.writeln(`\r\nComando no reconocido: ${primerComando}`);
        }
    }

    this.prompt();
}



clearScreen() {
  // Utiliza un código ANSI para limpiar toda la pantalla y mover el cursor al inicio.
  this.write('\x1Bc');
  this.currentLine = []; // Borra la línea actual.
  this.prompt(); // Muestra el nuevo prompt.
}

}

const T = new TerminalPersonalizada();
T.open(document.getElementById("terminal"), true);
T.writeln("Bienvenido a xterm.js");
T.writeln("Esta es una emulación de terminal local, sin un terminal real en el backend.");
T.writeln("Escribe algunas teclas y comandos para probar.");
T.writeln("");
T.prompt();
