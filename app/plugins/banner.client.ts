// The ASCII-art banner printed to the browser console.
export default defineNuxtPlugin(() => {
  const consoleOptions = "background: #ffffff; color: #6b17e8";

  // prettier-ignore
  console.log("%c ▄▄▄▄     ▄▄▄▄            ▄▄▄▄                                                                ▄▄▄▄", consoleOptions);
  // prettier-ignore
  console.log("%c  ████▄   ███ ▄▄▄▄  ▄▄▄▄   ███▄▄▄▄▄    ▄▄▄▄▄▄▄   ▄▄ ▄▄▄ ▄▄▄▄   ▄▄ ▄▄▄ ▄▄▄▄    ▄▄▄▄▄▄▄    ▄▄▄▄▄███ ", consoleOptions);
  // prettier-ignore
  console.log("%c  ██ ███▄█ ██  ███   ███   ███   ███   ▄▄▄▄▄███   ███ ███ ███   ███ ███ ███   ▄▄▄▄▄███ ███    ███ ", consoleOptions);
  // prettier-ignore
  console.log("%c  ██  ███  ██  ███   ███   ███   ███ ███    ███   ███ ███ ███   ███ ███ ███ ███    ███ ███    ███ ", consoleOptions);
  // prettier-ignore
  console.log("%c ▄██▄  █  ▄██▄  ███▄██ █▄ ▄███▄ ▄███▄ ██▄▄▄██ █▄ ▄███▄███▄███▄ ▄███▄███▄███▄ ██▄▄▄██ █▄  ██▄▄▄███▄", consoleOptions);

  // prettier-ignore
  console.log("%c ▄▄▄▄▄▄▄▄▄▄             ▄▄▄▄                              ", consoleOptions);
  // prettier-ignore
  console.log("%c  ███    ███ ▄▄▄▄▄▄▄▄▄█  ███▄▄▄▄▄    ▄▄▄▄▄▄▄   ▄▄ ▄▄▄▄▄▄  ", consoleOptions);
  // prettier-ignore
  console.log("%c  ███▄▄▄▄██ ███▄▄▄▄▄▄█   ███   ███   ▄▄▄▄▄███   ███   ███ ", consoleOptions);
  // prettier-ignore
  console.log("%c  ███  ██▄  ███          ███   ███ ███    ███   ███   ███ ", consoleOptions);
  // prettier-ignore
  console.log("%c ▄███▄  ██▄█  ██▄▄▄▄███ ▄███▄ ▄███▄ ██▄▄▄██ █▄ ▄███▄ ▄███▄", consoleOptions);

  // prettier-ignore
  console.log("%c ▄▄▄▄▄▄▄▄█                                          ▄▄▄▄ ", consoleOptions);
  // prettier-ignore
  console.log("%c ███           ▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄█ ▄▄▄▄▄▄▄▄▄█  ▄▄▄▄▄███ ", consoleOptions);
  // prettier-ignore
  console.log("%c ███▄▄▄▄▄▄    ▄▄▄▄▄███  ███▄▄▄▄▄▄█ ███▄▄▄▄▄▄█ ███    ███ ", consoleOptions);
  // prettier-ignore
  console.log("%c         ███ ███    ███ ███        ███        ███    ███ ", consoleOptions);
  // prettier-ignore
  console.log("%c ▄██▄▄▄▄███   ██▄▄▄██ █▄  ██▄▄▄▄███  ██▄▄▄▄███  ██▄▄▄███▄", consoleOptions);
});
