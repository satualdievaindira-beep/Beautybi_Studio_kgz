Beauty Bi Studio: статический сайт

ЗАЛИТЬ НА RENDER
Вариант 1 (проще всего, Static Site):
  - New + > Static Site, подключить репозиторий с этими файлами
  - Build Command: оставить пустым
  - Publish Directory: .

Вариант 2 (Python, Web Service):
  - Build Command: (пусто)
  - Start Command: python server.py

ЗАПУСТИТЬ У СЕБЯ
  python server.py   и открыть http://localhost:8000

ЧТО ГДЕ МЕНЯТЬ
  data.js    - цены, услуги, номер WhatsApp, часы работы
  style.css  - оформление
  assets/    - логотип (круглый) и иконка
