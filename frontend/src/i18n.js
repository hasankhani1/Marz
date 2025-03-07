import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Login": "Login",
          "Username": "Username",
          "Password": "Password",
          "Dashboard": "Dashboard",
          "Users": "Users",
          "Logs": "Logs",
          "Notifications": "Notifications",
          "Create New User": "Create New User",
          "Traffic Limit (GB)": "Traffic Limit (GB)",
          "Role": "Role",
          "User": "User",
          "Admin": "Admin",
          "Superadmin": "Superadmin",
          "User Limit": "User Limit",
          "Create User": "Create User",
          "Check Online Status": "Check Online Status",
          "Delete": "Delete",
          "Renew": "Renew",
          "New Traffic (GB)": "New Traffic (GB)",
          "Days": "Days",
          "Apply": "Apply",
          "Welcome": "Welcome",
          "Dark Mode": "Dark Mode",
          "Yes": "Yes",
          "No": "No",
          "Expiry Date": "Expiry Date",
          "Online": "Online",
          "Active": "Active",
          "Mark as Read": "Mark as Read",
          "Servers": "Servers",
          "Settings": "Settings"
        }
      },
      fa: {
        translation: {
          "Login": "ورود",
          "Username": "نام کاربری",
          "Password": "رمز عبور",
          "Dashboard": "داشبورد",
          "Users": "کاربران",
          "Logs": "لاگ‌ها",
          "Notifications": "اعلان‌ها",
          "Create New User": "ایجاد کاربر جدید",
          "Traffic Limit (GB)": "محدودیت ترافیک (گیگابایت)",
          "Role": "نقش",
          "User": "کاربر",
          "Admin": "ادمین",
          "Superadmin": "سوپرادمین",
          "User Limit": "محدودیت کاربر",
          "Create User": "ایجاد کاربر",
          "Check Online Status": "بررسی وضعیت آنلاین",
          "Delete": "حذف",
          "Renew": "تمدید",
          "New Traffic (GB)": "ترافیک جدید (گیگابایت)",
          "Days": "روزها",
          "Apply": "اعمال",
          "Welcome": "خوش آمدید",
          "Dark Mode": "حالت تیره",
          "Yes": "بله",
          "No": "خیر",
          "Expiry Date": "تاریخ انقضا",
          "Online": "آنلاین",
          "Active": "فعال",
          "Mark as Read": "علامت‌گذاری به‌عنوان خوانده‌شده",
          "Servers": "سرورها",
          "Settings": "تنظیمات"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;