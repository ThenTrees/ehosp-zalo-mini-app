import { atom } from "jotai";
import {
  atomFamily,
  atomWithDefault,
  atomWithLazy,
  atomWithRefresh,
  atomWithReset,
  loadable,
} from "jotai/utils";
import {
  Article,
  AvailableTimeSlots,
  Booking,
  Department,
  DepartmentGroup,
  Doctor,
  Feedback,
  Inquiry,
  Invoice,
  Service,
  SymptomDescription,
  TimeSlot,
} from "./types";
import {
  mock7DaysTimeSlots,
  mockDoctors,
  mockBookings,
  mockServices,
  mockInvoices,
  mockArticles,
  mockDepartments,
  mockDepartmentGroups,
  mockSymptoms,
  mockFeedbackCategories,
} from "./utils/mock";
import { getUserInfo } from "zmp-sdk";
import { toLowerCaseNonAccentVietnamese, wait } from "./utils/miscellaneous";
import { NotifiableError } from "./utils/errors";

/**
 * Listings
 */
export const servicesState = atom<Promise<Service[]>>(mockServices);

export const doctorsState = atom<Promise<Doctor[]>>(mockDoctors);

export const availableTimeSlotsState =
  atom<Promise<AvailableTimeSlots[]>>(mock7DaysTimeSlots);

export const articlesState = atom<Promise<Article[]>>(mockArticles);

export const departmentGroupsState =
  atom<Promise<DepartmentGroup[]>>(mockDepartmentGroups);

export const departmentsState = atom<Promise<Department[]>>(mockDepartments);

export const schedulesState = atom<Promise<Booking[]>>(mockBookings);

export const invoicesState = atom<Promise<Invoice[]>>(mockInvoices);

export const symptomsState = atom<Promise<string[]>>(mockSymptoms);

export const feedbackCategoriesState = atom<Promise<string[]>>(
  mockFeedbackCategories
);

/**
 * Details
 */
export const serviceByIdState = atomFamily((id: number) =>
  atom(async (get) => {
    const services = await get(servicesState);
    return services.find((service) => service.id === id);
  })
);

export const departmentByIdState = atomFamily((id: number) =>
  atom(async (get) => {
    const departments = await get(departmentsState);
    return departments.find((dep) => dep.id === id);
  })
);

export const scheduleByIdState = atomFamily((id: number) =>
  atom(async (get) => {
    const schedules = await get(schedulesState);
    return schedules.find((s) => s.id === id);
  })
);

export const newsByIdState = atomFamily((id: number) =>
  atom(async (get) => {
    const articles = await get(articlesState);
    return articles.find((news) => news.id === id);
  })
);

/**
 * Heavily computed values
 */
export const departmentHierarchyState = atom(async (get) => {
  const [groups, deps] = await Promise.all([
    get(departmentGroupsState),
    get(departmentsState),
  ]);

  return groups.map((group) => ({
    ...group,
    subDepartments: deps.filter((dep) => dep.groupId === group.id),
  }));
});

export const searchResultState = atomFamily((keyword: string) =>
  loadable(
    atom(async (get) => {
      await wait(1500);
      const [doctors, departments, news] = await Promise.all([
        get(doctorsState),
        get(departmentsState),
        get(articlesState),
      ]);
      const normalizedKeyword = toLowerCaseNonAccentVietnamese(keyword);
      return {
        doctors: doctors.filter(
          (d) =>
            toLowerCaseNonAccentVietnamese(d.name).includes(
              normalizedKeyword
            ) ||
            toLowerCaseNonAccentVietnamese(d.specialties).includes(
              normalizedKeyword
            )
        ),
        departments: departments.filter((d) =>
          toLowerCaseNonAccentVietnamese(d.name).includes(normalizedKeyword)
        ),
        news: news.filter(
          (n) =>
            toLowerCaseNonAccentVietnamese(n.title).includes(
              normalizedKeyword
            ) ||
            toLowerCaseNonAccentVietnamese(n.category).includes(
              normalizedKeyword
            )
        ),
      };
    })
  )
);

export const userState = atomWithRefresh(() => {
  return getUserInfo({
    avatarType: "normal",
  }).catch(() => {
    throw new NotifiableError(
      "Vui lòng cho phép truy cập tên và ảnh đại diện!"
    );
  });
});

/**
 * Forms
 */
export const symptomFormState = atomWithReset<SymptomDescription>({
  symptoms: [],
  description: "",
  images: [],
});

export const bookingFormState = atomWithReset<{
  slot?: TimeSlot;
  doctor?: Doctor;
  department?: Department;
  symptoms: string[];
  description: string;
  images: string[];
}>({
  symptoms: [],
  description: "",
  images: [] as string[],
});

export const askFormState = atomWithReset<Inquiry>({
  symptoms: [],
  description: "",
  images: [],
});

export const feedbackFormState = atomWithReset<Feedback>({
  title: "",
  description: "",
  images: [],
  category: "",
});

/**
 * Miscellaenous
 */
export const customTitleState = atom("");
