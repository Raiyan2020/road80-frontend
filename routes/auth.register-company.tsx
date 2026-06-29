import React, { useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRegisterCompany } from "../shared/hooks/useRegisterCompany";
import { useCountries, useStates } from "../shared/hooks/useLocation";
import { useDepartments } from "../features/companies/hooks/useDepartments";
import {
  BuildingIcon,
  PhoneIcon,
  WhatsappIcon,
  ChevronRightIcon,
  SpinnerIcon,
  MailIcon,
} from "../components/Icons";
import { toast } from "sonner";
import { AppImage } from "@/components/AppImage";
import { z } from "zod";

const PHONE_DIGITS: Record<string, number> = {
  KW: 8,
  SA: 9,
  AE: 9,
  QA: 8,
  BH: 8,
  OM: 8,
  JO: 9,
  EG: 10,
  IQ: 10,
};
const DEFAULT_DIGITS = 10;

const registerCompanySchema = (phoneDigits: number, whatsappDigits: number) =>
  z.object({
    name: z.string().trim().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    email: z
      .union([
        z.string().trim().email("البريد الإلكتروني غير صحيح"),
        z.literal(""),
      ])
      .optional(),
    caption: z
      .string()
      .trim()
      .min(1, "يرجى إدخال وصف الشركة")
      .min(10, "الوصف يجب أن يكون 10 أحرف على الأقل")
      .max(255, "الوصف يجب أن يكون 255 حرفاً على الأكثر"),
    company_department_id: z
      .union([z.string(), z.number()])
      .refine((val) => !!val, "يرجى اختيار القسم"),
    country_id: z
      .union([z.string(), z.number()])
      .refine((val) => !!val, "يرجى اختيار الدولة"),
    state_id: z
      .union([z.string(), z.number()])
      .refine((val) => !!val, "يرجى اختيار المحافظة"),
    phone: z
      .string()
      .trim()
      .regex(/^\d+$/, "رقم الهاتف يجب أن يحتوي على أرقام فقط")
      .length(phoneDigits, `رقم الهاتف يجب أن يكون ${phoneDigits} أرقام`),
    whatsapp_phone: z
      .string()
      .trim()
      .regex(/^\d+$/, "رقم الواتساب يجب أن يحتوي على أرقام فقط")
      .length(
        whatsappDigits,
        `رقم الواتساب يجب أن يكون ${whatsappDigits} أرقام`,
      ),
    image: z.any().refine((file) => file instanceof File, "يرجى رفع صورة الشركة"),
  });

type RegisterCompanyErrors = Partial<
  Record<
    | "name"
    | "email"
    | "caption"
    | "company_department_id"
    | "country_id"
    | "state_id"
    | "phone"
    | "whatsapp_phone"
    | "image",
    string
  >
>;

export const Route = createFileRoute("/auth/register-company")({
  component: RegisterCompanyPage,
});

function RegisterCompanyPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterCompany();

  const { data: countriesResponse, isLoading: loadingCountries } =
    useCountries();
  const { data: departmentsResponse, isLoading: loadingDepts } =
    useDepartments();

  // The API wrappers might return { data: [...] } or just [...] depending on implementation
  const countries = (countriesResponse as any)?.data || countriesResponse || [];
  const departments =
    (departmentsResponse as any)?.data || departmentsResponse || [];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    caption: "",
    company_department_id: "",
    country_id: "",
    state_id: "",
    phone: "",
    whatsapp_phone: "",
  });

  const { data: statesResponse, isLoading: loadingStates } = useStates(
    formData.country_id,
  );
  const states = (statesResponse as any)?.data || statesResponse || [];

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<RegisterCompanyErrors>({});

  const [phoneCountryId, setPhoneCountryId] = useState<number>(1);
  const [whatsappCountryId, setWhatsappCountryId] = useState<number>(1);

  const maxPhoneDigits =
    PHONE_DIGITS[
      countries.find((c: any) => c.id === phoneCountryId)?.country_code ?? "KW"
    ] ?? DEFAULT_DIGITS;
  const maxWhatsappDigits =
    PHONE_DIGITS[
      countries.find((c: any) => c.id === whatsappCountryId)?.country_code ??
        "KW"
    ] ?? DEFAULT_DIGITS;

  const schema = registerCompanySchema(maxPhoneDigits, maxWhatsappDigits);

  const setFieldError = (field: keyof RegisterCompanyErrors, value?: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (value) next[field] = value;
      else delete next[field];
      return next;
    });
  };

  const clearAllErrors = () => setErrors({});

  const getFieldError = (field: keyof RegisterCompanyErrors) => errors[field];

  const mapZodErrors = (err: z.ZodError): RegisterCompanyErrors => {
    const mapped: RegisterCompanyErrors = {};
    err.issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field === "string" && !mapped[field as keyof RegisterCompanyErrors]) {
        mapped[field as keyof RegisterCompanyErrors] = issue.message;
      }
    });
    return mapped;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const maxSize = 1 * 1024 * 1024; // 1 MB
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      
      if (!validTypes.includes(file.type) || file.size > maxSize) {
        toast.error("عذراً، يجب أن يكون حجم الصورة أقل من 1 ميجابايت وبصيغة JPG أو PNG فقط.");
        setFieldError("image", "يرجى رفع صورة بصيغة JPG أو PNG وحجم أقل من 1 ميجابايت");
        // Clear the input so they can try again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setFieldError("image");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset state if country changes
      ...(name === "country_id" ? { state_id: "" } : {}),
    }));

    if (name in formData || name === "country_id" || name === "state_id") {
      setFieldError(name as keyof RegisterCompanyErrors);
      if (name === "country_id") setFieldError("state_id");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payloadForValidation = {
      ...formData,
      image: imageFile,
    };

    const result = schema.safeParse(payloadForValidation);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      return;
    }

    clearAllErrors();

    const payload = {
      name: formData.name,
      email: formData.email,
      caption: formData.caption,
      state_id: formData.state_id,
      country_id: formData.country_id,
      phone: formData.phone,
      whatsapp_phone: formData.whatsapp_phone,
      phone_country_id: phoneCountryId,
      whatsapp_country_id: whatsappCountryId,
      image: imageFile,
      company_department_id: formData.company_department_id,
    };

    registerMutation.mutate(payload, {
      onSuccess: (response: any) => {
        if (response.status || response.message === "success") {
          toast.success("تم التسجيل بنجاح، في انتظار موافقة الإدارة", { closeButton: true });
          navigate({ to: "/auth" });
        } else {
          toast.error(response.message || "حدث خطأ ما أثناء التسجيل");
        }
      },
      onError: (error: any) => {
        const message =
          error?.data?.message ||
          error?.message ||
          "حدث خطأ ما أثناء التسجيل، يرجى المحاولة لاحقاً";
        toast.error(message);
      },
    });
  };

  return (
    <div
      className="absolute inset-0 bg-bg dark:bg-slate-950 overflow-y-auto overflow-x-hidden no-scrollbar animate-fade-in transition-colors duration-300"
      dir="rtl"
    >
      <div className="p-4 sm:p-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="self-start flex items-center gap-1 text-gray-500 dark:text-slate-400 hover:text-navy dark:hover:text-blue transition-colors font-bold text-sm"
          >
            <ChevronRightIcon className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />{" "}
            العودة للخلف
          </button>

          <div className="w-24 h-24 mb-2">
            <AppImage
              src="/road-logo.png"
              alt="80road"
              className="w-full h-full drop-shadow-xl"
              coverClassName="object-contain"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight">
              تسجيل شركة جديدة
            </h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm px-4">
              انضم إلى شبكة 80road العقارية وابدأ بعرض عقارات شركتك لجمهور واسع
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Image Uploader */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-navy dark:text-slate-200">
                شعار الشركة
              </span>
              <div
                className="w-28 h-28 rounded-3xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer relative active:scale-95 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <AppImage
                  src={previewImage}
                  alt="Logo"
                  className="w-full h-full"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png, image/jpg"
                  onChange={handleImageChange}
                />
              </div>
              {getFieldError("image") && (
                <p className="text-xs text-red-500 font-medium text-center">
                  {getFieldError("image")}
                </p>
              )}

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                  <MailIcon className="w-4 h-4 text-blue" />
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@road80.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => {
                    if (formData.email.trim()) {
                      const emailResult = z
                        .string()
                        .trim()
                        .email("البريد الإلكتروني غير صحيح")
                        .safeParse(formData.email);
                      setFieldError(
                        "email",
                        emailResult.success ? undefined : emailResult.error.issues[0]?.message,
                      );
                    } else {
                      setFieldError("email");
                    }
                  }}
                  className="h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors text-left ltr"
                  dir="ltr"
                />
                {getFieldError("email") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("email")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Company Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                  <BuildingIcon className="w-4 h-4 text-blue" />
                  اسم الشركة
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="أدخل اسم الشركة"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => {
                    const value = formData.name.trim();
                    setFieldError(
                      "name",
                      value.length < 3
                        ? "الاسم يجب أن يكون 3 أحرف على الأقل"
                        : undefined,
                    );
                  }}
                  className="h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors"
                />
                {getFieldError("name") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("name")}
                  </p>
                )}
              </div>

              {/* Department Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">
                  القسم
                </label>
                <select
                  name="company_department_id"
                  value={formData.company_department_id}
                  onChange={handleChange}
                  onBlur={() => {
                    if (!formData.company_department_id) {
                      setFieldError("company_department_id", "يرجى اختيار القسم");
                    }
                  }}
                  className="h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors appearance-none"
                  style={{
                    backgroundPosition: "left 1rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                    backgroundSize: "0.65rem auto",
                  }}
                >
                  <option value="">اختر القسم</option>
                  {!loadingDepts &&
                    departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.value}
                      </option>
                    ))}
                </select>
                {getFieldError("company_department_id") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("company_department_id")}
                  </p>
                )}
              </div>

              {/* Country Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">
                  الدولة
                </label>
                <select
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleChange}
                  onBlur={() => {
                    if (!formData.country_id) {
                      setFieldError("country_id", "يرجى اختيار الدولة");
                    }
                  }}
                  className="h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors appearance-none"
                  style={{
                    backgroundPosition: "left 1rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                    backgroundSize: "0.65rem auto",
                  }}
                >
                  <option value="">اختر الدولة</option>
                  {!loadingCountries &&
                    countries.map((c: any) => (
                      <option key={c.id || c.code} value={c.id || c.code}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {getFieldError("country_id") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("country_id")}
                  </p>
                )}
              </div>

              {/* State Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">
                  المحافظة
                </label>
                <select
                  name="state_id"
                  value={formData.state_id}
                  onChange={handleChange}
                  disabled={!formData.country_id || loadingStates}
                  onBlur={() => {
                    if (!formData.state_id) {
                      setFieldError("state_id", "يرجى اختيار المحافظة");
                    }
                  }}
                  className="h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors appearance-none disabled:opacity-50"
                  style={{
                    backgroundPosition: "left 1rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                    backgroundSize: "0.65rem auto",
                  }}
                >
                  <option value="">
                    {!formData.country_id
                      ? "اختر الدولة أولاً"
                      : "اختر المحافظة"}
                  </option>
                  {!loadingStates &&
                    states.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                {getFieldError("state_id") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("state_id")}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                  <PhoneIcon className="w-4 h-4 text-blue" />
                  رقم الهاتف
                </label>
                <div
                  dir="ltr"
                  className="flex items-center w-full h-14 bg-gray-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue transition-all border border-pale dark:border-slate-700"
                >
                  <div className="relative shrink-0 flex items-center h-full px-2 border-r border-gray-200 dark:border-slate-700">
                    <select
                      value={phoneCountryId}
                      onChange={(e) => {
                        setPhoneCountryId(Number(e.target.value));
                        setFormData((prev) => ({ ...prev, phone: "" }));
                        setFieldError("phone");
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-navy dark:text-slate-200 bg-white dark:bg-slate-900"
                      disabled={loadingCountries || countries.length === 0}
                    >
                      {countries.length > 0 ? (
                        countries.map((c: any) => (
                          <option
                            key={c.id}
                            value={c.id}
                            className="text-navy dark:text-slate-200 bg-white dark:bg-slate-900 font-bold"
                          >
                            {c.country_code || "KW"} {c.phone_code}
                          </option>
                        ))
                      ) : (
                        <option
                          value={1}
                          className="text-navy dark:text-slate-200 bg-white dark:bg-slate-900 font-bold"
                        >
                          KW +965
                        </option>
                      )}
                    </select>
                    <div className="pointer-events-none flex items-center gap-1 text-navy dark:text-blue font-semibold text-xs tracking-wide">
                      <span>
                        {countries.find((c: any) => c.id === phoneCountryId)
                          ?.country_code || "KW"}
                      </span>
                      <span>
                        {countries.find((c: any) => c.id === phoneCountryId)
                          ?.phone_code || "+965"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 h-full">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({
                          ...prev,
                          phone: raw.slice(0, maxPhoneDigits),
                        }));
                        setFieldError("phone");
                      }}
                      maxLength={maxPhoneDigits}
                      className="w-full h-full bg-transparent px-3 text-right font-bold text-navy dark:text-slate-100 tracking-wider focus:outline-none"
                      placeholder={`أدخل ${maxPhoneDigits} أرقام`}
                      dir="ltr"
                    />
                  </div>
                </div>
                {getFieldError("phone") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("phone")}
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                  <WhatsappIcon className="w-4 h-4 text-green-500" />
                  رقم الواتساب
                </label>
                <div
                  dir="ltr"
                  className="flex items-center w-full h-14 bg-gray-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 transition-all border border-pale dark:border-slate-700"
                >
                  <div className="relative shrink-0 flex items-center h-full px-2 border-r border-gray-200 dark:border-slate-700">
                    <select
                      value={whatsappCountryId}
                      onChange={(e) => {
                        setWhatsappCountryId(Number(e.target.value));
                        setFormData((prev) => ({
                          ...prev,
                          whatsapp_phone: "",
                        }));
                        setFieldError("whatsapp_phone");
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-navy dark:text-slate-200 bg-white dark:bg-slate-900"
                      disabled={loadingCountries || countries.length === 0}
                    >
                      {countries.length > 0 ? (
                        countries.map((c: any) => (
                          <option
                            key={c.id}
                            value={c.id}
                            className="text-navy dark:text-slate-200 bg-white dark:bg-slate-900 font-bold"
                          >
                            {c.country_code || "KW"} {c.phone_code}
                          </option>
                        ))
                      ) : (
                        <option
                          value={1}
                          className="text-navy dark:text-slate-200 bg-white dark:bg-slate-900 font-bold"
                        >
                          KW +965
                        </option>
                      )}
                    </select>
                    <div className="pointer-events-none flex items-center gap-1 text-navy dark:text-green-500 font-semibold text-xs tracking-wide">
                      <span>
                        {countries.find((c: any) => c.id === whatsappCountryId)
                          ?.country_code || "KW"}
                      </span>
                      <span>
                        {countries.find((c: any) => c.id === whatsappCountryId)
                          ?.phone_code || "+965"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 h-full">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.whatsapp_phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({
                          ...prev,
                          whatsapp_phone: raw.slice(0, maxWhatsappDigits),
                        }));
                        setFieldError("whatsapp_phone");
                      }}
                      maxLength={maxWhatsappDigits}
                      className="w-full h-full bg-transparent px-3 text-right font-bold text-navy dark:text-slate-100 tracking-wider focus:outline-none"
                      placeholder={`أدخل ${maxWhatsappDigits} أرقام`}
                      dir="ltr"
                    />
                  </div>
                </div>
                {getFieldError("whatsapp_phone") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("whatsapp_phone")}
                  </p>
                )}
              </div>

              {/* Caption */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">
                  وصف الشركة
                </label>
                <textarea
                  name="caption"
                  placeholder="تحدث قليلاً عن نشاط الشركة العقاري..."
                  value={formData.caption}
                  onChange={handleChange}
                  onBlur={() => {
                    const value = formData.caption.trim();
                    setFieldError(
                      "caption",
                      value.length < 10
                        ? "الوصف يجب أن يكون 10 أحرف على الأقل"
                        : undefined,
                    );
                  }}
                  className="min-h-[120px] p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors resize-y"
                />
                {getFieldError("caption") && (
                  <p className="text-xs text-red-500 font-medium px-1">
                    {getFieldError("caption")}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="mt-2 w-full h-14 rounded-2xl bg-navy dark:bg-blue text-white font-black text-lg flex items-center justify-center shadow-lg shadow-navy/20 dark:shadow-blue/20 active:scale-95 transition-all disabled:opacity-70"
            >
              {registerMutation.isPending ? (
                <SpinnerIcon className="w-6 h-6 animate-spin" />
              ) : (
                "تقديم طلب التسجيل"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
