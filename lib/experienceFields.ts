export type FieldType = 'text' | 'number' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export const FIELD_SCHEMAS: Record<string, FieldDef[]> = {
  학력: [
    { key: 'level', label: '학교 구분', type: 'select', options: ['고등학교', '대학교', '대학원'] },
    { key: 'major', label: '전공', type: 'text' },
    { key: 'major_type', label: '전공 구분', type: 'select', options: ['주전공', '복수전공', '부전공', '연계전공', '융합전공'] },
    { key: 'gpa', label: '학점', type: 'text' },
    { key: 'status', label: '졸업 상태', type: 'select', options: ['졸업', '졸업예정', '재학', '휴학', '수료', '중퇴'] },
  ],
  경력: [
    { key: 'employment_type', label: '고용형태', type: 'select', options: ['정규직', '계약직', '인턴', '프리랜서', '기타'] },
    { key: 'employment_status', label: '재직 상태', type: 'select', options: ['재직중', '퇴사'] },
    { key: 'department', label: '부서', type: 'text' },
    { key: 'position', label: '직급', type: 'text' },
  ],
  프로젝트: [
    { key: 'workplace', label: '발주처/근무처', type: 'text' },
    { key: 'role', label: '참여 역할', type: 'text' },
    { key: 'contribution_type', label: '기여도 구분', type: 'select', options: ['개인', '팀'] },
    { key: 'contribution_percent', label: '기여도(%)', type: 'number' },
  ],
  자격증: [
    { key: 'cert_number', label: '등록번호', type: 'text' },
    { key: 'grade', label: '등급/점수', type: 'text' },
  ],
  어학: [
    { key: 'language', label: '언어', type: 'text' },
    { key: 'score', label: '점수', type: 'text' },
    { key: 'grade', label: '등급', type: 'text' },
    { key: 'cert_number', label: '등록번호', type: 'text' },
    {
      key: 'speaking_level',
      label: '회화 수준',
      type: 'select',
      options: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Authentic'],
    },
    {
      key: 'writing_level',
      label: '작문 수준',
      type: 'select',
      options: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Authentic'],
    },
    {
      key: 'reading_level',
      label: '독해 수준',
      type: 'select',
      options: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Authentic'],
    },
  ],
  수상: [{ key: 'rank', label: '수상 등수', type: 'text' }],
  학내외활동: [
    { key: 'activity_type', label: '활동 구분', type: 'text' },
    { key: 'role', label: '역할', type: 'text' },
  ],
  봉사: [
    { key: 'volunteer_type', label: '봉사 구분', type: 'text' },
    { key: 'hours', label: '봉사 시간', type: 'number' },
    { key: 'region', label: '봉사 지역', type: 'text' },
    { key: 'cert_number', label: '발급번호', type: 'text' },
  ],
  교육: [
    { key: 'institution_type', label: '교육기관 구분', type: 'text' },
    { key: 'hours', label: '교육 시간', type: 'number' },
  ],
};

export function getFieldSchema(category: string): FieldDef[] {
  return FIELD_SCHEMAS[category] ?? [];
}

export function sanitizeFields(category: string, raw: Record<string, unknown>): Record<string, string> {
  const schema = getFieldSchema(category);
  const result: Record<string, string> = {};
  for (const def of schema) {
    const value = raw[def.key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text) continue;
    if (def.type === 'select' && def.options && !def.options.includes(text)) continue;
    if (def.type === 'number' && Number.isNaN(Number(text))) continue;
    result[def.key] = text;
  }
  return result;
}
