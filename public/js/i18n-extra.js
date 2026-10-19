/* Dictionnaires des langues supplémentaires : navigation et opérations courantes. */
(() => {
  const codes = ['es', 'de', 'ar', 'ru', 'it'];
  codes.forEach(c => { TRADUCTIONS[c] = {}; });
  const lignes = `
Tableau de bord|Panel de control|Dashboard|لوحة التحكم|Панель управления|Pannello di controllo
Tableau de bord plateforme|Panel de la plataforma|Plattform-Dashboard|لوحة تحكم المنصة|Панель платформы|Pannello della piattaforma
Pilotage|Resumen|Übersicht|نظرة عامة|Обзор|Panoramica
Ventes|Ventas|Verkäufe|المبيعات|Продажи|Vendite
Caisse|Caja|Kasse|الصندوق|Касса|Cassa
Produits|Productos|Produkte|المنتجات|Товары|Prodotti
Catalogue & stock|Catálogo y existencias|Katalog und Bestand|الكتالوج والمخزون|Каталог и запасы|Catalogo e scorte
Stocks|Existencias|Bestände|المخزون|Запасы|Scorte
Stock restant|Existencias restantes|Restbestand|المخزون المتبقي|Остаток запасов|Scorte rimanenti
Transferts|Transferencias|Umlagerungen|التحويلات|Перемещения|Trasferimenti
Achats|Compras|Einkäufe|المشتريات|Закупки|Acquisti
Clients|Clientes|Kunden|العملاء|Клиенты|Clienti
Fournisseurs|Proveedores|Lieferanten|الموردون|Поставщики|Fornitori
Employés|Empleados|Mitarbeiter|الموظفون|Сотрудники|Dipendenti
Salaires|Salarios|Gehälter|الرواتب|Зарплаты|Stipendi
Recrutements|Contratación|Personalbeschaffung|التوظيف|Подбор персонала|Selezione del personale
Ressources humaines|Recursos humanos|Personalwesen|الموارد البشرية|Кадры|Risorse umane
Rapports|Informes|Berichte|التقارير|Отчёты|Rapporti
Administration|Administración|Verwaltung|الإدارة|Администрирование|Amministrazione
Magasins|Almacenes|Lager|المخازن|Склады|Magazzini
Boutiques|Tiendas|Filialen|المتاجر|Магазины|Negozi
Comptes & rôles|Cuentas y roles|Konten und Rollen|الحسابات والأدوار|Учётные записи и роли|Account e ruoli
Comptes et rôles|Cuentas y roles|Konten und Rollen|الحسابات والأدوار|Учётные записи и роли|Account e ruoli
Paramètres|Configuración|Einstellungen|الإعدادات|Настройки|Impostazioni
Abonnement|Suscripción|Abonnement|الاشتراك|Подписка|Abbonamento
Aide|Ayuda|Hilfe|المساعدة|Помощь|Aiuto
Aide & contact|Ayuda y contacto|Hilfe und Kontakt|المساعدة والتواصل|Помощь и контакты|Aiuto e contatti
Messages|Mensajes|Nachrichten|الرسائل|Сообщения|Messaggi
Inventaires|Inventarios|Inventuren|الجرد|Инвентаризации|Inventari
Plateforme|Plataforma|Plattform|المنصة|Платформа|Piattaforma
Console propriétaire|Consola del propietario|Betreiberkonsole|وحدة تحكم المالك|Консоль владельца|Console del proprietario
Entreprises|Empresas|Unternehmen|الشركات|Компании|Aziende
Paiements|Pagos|Zahlungen|المدفوعات|Платежи|Pagamenti
Réglages|Preferencias|Einstellungen|التفضيلات|Параметры|Preferenze
Mon profil|Mi perfil|Mein Profil|ملفي الشخصي|Мой профиль|Il mio profilo
Déconnexion|Cerrar sesión|Abmelden|تسجيل الخروج|Выйти|Esci
Connexion|Iniciar sesión|Anmelden|تسجيل الدخول|Вход|Accedi
Se connecter|Iniciar sesión|Anmelden|تسجيل الدخول|Войти|Accedi
Adresse email|Correo electrónico|E-Mail-Adresse|البريد الإلكتروني|Электронная почта|Indirizzo email
Mot de passe|Contraseña|Passwort|كلمة المرور|Пароль|Password
Nom|Nombre|Name|الاسم|Имя|Nome
Prénom|Apellido|Vorname|الاسم الأول|Имя|Nome
Téléphone|Teléfono|Telefon|الهاتف|Телефон|Telefono
Adresse|Dirección|Adresse|العنوان|Адрес|Indirizzo
Ville|Ciudad|Stadt|المدينة|Город|Città
Nom de l'entreprise|Nombre de la empresa|Unternehmensname|اسم الشركة|Название компании|Nome dell’azienda
Informations de l'entreprise|Información de la empresa|Unternehmensdaten|بيانات الشركة|Данные компании|Dati dell’azienda
Langue|Idioma|Sprache|اللغة|Язык|Lingua
Langue de l'application|Idioma de la aplicación|Anwendungssprache|لغة التطبيق|Язык приложения|Lingua dell’applicazione
Apparence|Apariencia|Darstellung|المظهر|Оформление|Aspetto
Thème de l'application|Tema de la aplicación|Anwendungsdesign|مظهر التطبيق|Тема приложения|Tema dell’applicazione
Clair (blanc)|Claro (blanco)|Hell (weiß)|فاتح (أبيض)|Светлая (белая)|Chiaro (bianco)
Sombre (noir)|Oscuro (negro)|Dunkel (schwarz)|داكن (أسود)|Тёмная (чёрная)|Scuro (nero)
Devise d’affichage|Moneda de visualización|Anzeigewährung|عملة العرض|Валюта отображения|Valuta di visualizzazione
Actualiser les taux|Actualizar tipos de cambio|Wechselkurse aktualisieren|تحديث أسعار الصرف|Обновить курсы|Aggiorna i tassi
Enregistrer|Guardar|Speichern|حفظ|Сохранить|Salva
Enregistrer les paramètres|Guardar configuración|Einstellungen speichern|حفظ الإعدادات|Сохранить настройки|Salva le impostazioni
Annuler|Cancelar|Abbrechen|إلغاء|Отмена|Annulla
Fermer|Cerrar|Schließen|إغلاق|Закрыть|Chiudi
Supprimer|Eliminar|Löschen|حذف|Удалить|Elimina
Modifier|Editar|Bearbeiten|تعديل|Изменить|Modifica
Confirmer|Confirmar|Bestätigen|تأكيد|Подтвердить|Conferma
Valider|Validar|Bestätigen|اعتماد|Подтвердить|Convalida
Rechercher|Buscar|Suchen|بحث|Поиск|Cerca
Ajouter|Añadir|Hinzufügen|إضافة|Добавить|Aggiungi
Actualiser|Actualizar|Aktualisieren|تحديث|Обновить|Aggiorna
Imprimer|Imprimir|Drucken|طباعة|Печать|Stampa
Exporter|Exportar|Exportieren|تصدير|Экспорт|Esporta
Date|Fecha|Datum|التاريخ|Дата|Data
Statut|Estado|Status|الحالة|Статус|Stato
Actif|Activo|Aktiv|نشط|Активен|Attivo
Fermé|Cerrado|Geschlossen|مغلق|Закрыт|Chiuso
En attente|Pendiente|Ausstehend|قيد الانتظار|В ожидании|In attesa
Validé|Validado|Bestätigt|مؤكد|Подтверждён|Convalidato
Rejeté|Rechazado|Abgelehnt|مرفوض|Отклонён|Rifiutato
Montant|Importe|Betrag|المبلغ|Сумма|Importo
Quantité|Cantidad|Menge|الكمية|Количество|Quantità
Prix de vente|Precio de venta|Verkaufspreis|سعر البيع|Цена продажи|Prezzo di vendita
Prix d'achat|Precio de compra|Einkaufspreis|سعر الشراء|Закупочная цена|Prezzo di acquisto
Prix à définir|Precio por definir|Preis festlegen|السعر غير محدد|Укажите цену|Prezzo da definire
Total|Total|Gesamt|الإجمالي|Итого|Totale
Remise|Descuento|Rabatt|الخصم|Скидка|Sconto
CA du jour|Ventas del día|Tagesumsatz|مبيعات اليوم|Выручка за день|Fatturato giornaliero
CA du mois|Ventas del mes|Monatsumsatz|مبيعات الشهر|Выручка за месяц|Fatturato mensile
Valeur du stock|Valor de existencias|Bestandswert|قيمة المخزون|Стоимость запасов|Valore delle scorte
Entrées du jour|Entradas del día|Tageseingänge|واردات اليوم|Поступления за день|Entrate del giorno
Sorties du jour|Salidas del día|Tagesausgänge|صادرات اليوم|Расход за день|Uscite del giorno
Ventes aujourd'hui|Ventas de hoy|Verkäufe heute|مبيعات اليوم|Продажи сегодня|Vendite di oggi
Destinataire|Destinatario|Empfänger|المستلم|Получатель|Destinatario
Expéditeur|Remitente|Absender|المرسل|Отправитель|Mittente
Objet|Asunto|Betreff|الموضوع|Тема|Oggetto
Message|Mensaje|Nachricht|الرسالة|Сообщение|Messaggio
Envoyer|Enviar|Senden|إرسال|Отправить|Invia
Répondre|Responder|Antworten|رد|Ответить|Rispondi
Reçus|Recibidos|Posteingang|الوارد|Входящие|Ricevuti
Envoyés|Enviados|Gesendet|الصادر|Отправленные|Inviati
Écrire|Redactar|Verfassen|كتابة|Написать|Scrivi
Nouveau message|Nuevo mensaje|Neue Nachricht|رسالة جديدة|Новое сообщение|Nuovo messaggio
Abonnement expiré|Suscripción caducada|Abonnement abgelaufen|انتهى الاشتراك|Подписка истекла|Abbonamento scaduto
Abonnement actif|Suscripción activa|Abonnement aktiv|اشتراك نشط|Подписка активна|Abbonamento attivo
Essai gratuit|Prueba gratuita|Kostenlose Testversion|تجربة مجانية|Пробный период|Prova gratuita
Mensuel|Mensual|Monatlich|شهري|Ежемесячно|Mensile
Annuel|Anual|Jährlich|سنوي|Ежегодно|Annuale
Choisir un moyen de paiement|Elegir un medio de pago|Zahlungsart auswählen|اختيار وسيلة الدفع|Выберите способ оплаты|Scegli un metodo di pagamento
Historique des paiements|Historial de pagos|Zahlungsverlauf|سجل المدفوعات|История платежей|Cronologia dei pagamenti
Jours restants|Días restantes|Verbleibende Tage|الأيام المتبقية|Осталось дней|Giorni rimanenti
Formule en cours|Plan actual|Aktueller Tarif|الخطة الحالية|Текущий тариф|Piano attuale
Total réglé|Total pagado|Gesamt bezahlt|إجمالي المدفوع|Всего оплачено|Totale pagato
Référence|Referencia|Referenz|المرجع|Номер|Riferimento
Service|Servicio|Dienst|الخدمة|Сервис|Servizio
Montant du paiement|Importe del pago|Zahlungsbetrag|مبلغ الدفع|Сумма платежа|Importo del pagamento
Compte rendu d'inventaire|Informe de inventario|Inventurbericht|تقرير الجرد|Отчёт инвентаризации|Rapporto d’inventario
Clôturer|Cerrar inventario|Abschließen|إقفال الجرد|Завершить|Chiudi inventario
Stock attendu|Existencias previstas|Sollbestand|المخزون المتوقع|Ожидаемый остаток|Scorte previste
Stock compté|Existencias contadas|Gezählter Bestand|المخزون المعدود|Подсчитанный остаток|Scorte contate
Écart|Diferencia|Abweichung|الفرق|Расхождение|Differenza
Brouillon|Borrador|Entwurf|مسودة|Черновик|Bozza
Clôturé|Cerrado|Abgeschlossen|مقفل|Завершён|Chiuso
Réseau de magasins|Red de puntos de venta|Filialnetz|شبكة نقاط البيع|Сеть торговых точек|Rete dei punti vendita
Magasin source|Almacén de origen|Quelllager|المخزن المصدر|Склад-источник|Magazzino di origine
Nouvelle boutique|Nueva tienda|Neue Filiale|متجر جديد|Новый магазин|Nuovo negozio
Nouveau magasin|Nuevo almacén|Neues Lager|مخزن جديد|Новый склад|Nuovo magazzino
Nom du magasin|Nombre del almacén|Lagername|اسم المخزن|Название склада|Nome del magazzino
Code|Código|Code|الرمز|Код|Codice
Responsable|Responsable|Verantwortlicher|المسؤول|Ответственный|Responsabile
Montant reçu|Importe recibido|Erhaltener Betrag|المبلغ المستلم|Получено|Importo ricevuto
Monnaie à rendre|Cambio|Rückgeld|الباقي|Сдача|Resto
Mode de paiement|Medio de pago|Zahlungsart|وسيلة الدفع|Способ оплаты|Metodo di pagamento
Client de passage|Cliente ocasional|Laufkunde|عميل عابر|Разовый клиент|Cliente occasionale
Chiffre d'affaires cumulé|Facturación acumulada|Gesamtumsatz|إجمالي الإيرادات|Общая выручка|Fatturato cumulato
Entreprises clientes|Empresas clientes|Kundenunternehmen|الشركات العميلة|Компании-клиенты|Aziende clienti
Dernières entreprises inscrites|Últimas empresas registradas|Neu registrierte Unternehmen|أحدث الشركات المسجلة|Новые компании|Ultime aziende registrate
Voir toutes les entreprises|Ver todas las empresas|Alle Unternehmen anzeigen|عرض كل الشركات|Все компании|Vedi tutte le aziende
Fiche complète|Ficha completa|Vollständiges Profil|الملف الكامل|Полная карточка|Scheda completa
Réactiver sans abonnement|Reactivar sin suscripción|Ohne Abonnement freischalten|إعادة التفعيل دون اشتراك|Активировать без подписки|Riattiva senza abbonamento
`;
  for (const ligne of lignes.trim().split('\n')) {
    const [cle, ...valeurs] = ligne.split('|');
    codes.forEach((code, i) => { if (valeurs[i]) TRADUCTIONS[code][cle] = valeurs[i]; });
  }
})();
Object.assign(TRADUCTIONS.en, {
  'Paramètres de la plateforme': 'Platform settings',
  'Compte propriétaire': 'Owner account',
  'Envoi des emails — Gmail / Google Workspace': 'Email delivery — Gmail / Google Workspace',
  'Aucun email envoyé': 'No email sent',
  'Email transmis au serveur d’envoi': 'Email submitted to the mail server',
  'Échec de l’envoi': 'Email delivery failed',
  'Envoi non configuré': 'Email delivery not configured',
  'Vérifiez votre adresse email': 'Verify your email address',
  'Nouveau code envoyé': 'New code sent',
  'Renvoyer le code': 'Resend the code',
  'Enregistrer Gmail': 'Save Gmail settings',
  'Vérifier la connexion': 'Check connection',
  'Envoyer un email de test': 'Send a test email',
  'Mot de passe d’application Google': 'Google app password',
  'Adresse Gmail expéditrice': 'Sender Gmail address',
  'Adresse de connexion de l’application': 'Application login URL',
  'Consulter le journal des emails': 'View email log',
  'Coordonnées et assistance': 'Contact and support',
  'Enregistrer les coordonnées': 'Save contact details',
  'Email d’assistance': 'Support email',
  'Sécurité de la connexion': 'Connection security',
  'Adresse expéditeur': 'Sender address'
});
