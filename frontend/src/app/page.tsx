import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>

        <form className={styles.form} aria-label="Formulario de inicio de sesión">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Usuario:
            </label>
            <input
              className={styles.input}
              id="username"
              type="text"
              name="username"
              placeholder="Ejemplo: usuario"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña:
            </label>
            <input
              className={styles.input}
              id="password"
              type="password"
              name="password"
              placeholder="********"
              autoComplete="current-password"
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.button} type="button">
              Confirmar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
