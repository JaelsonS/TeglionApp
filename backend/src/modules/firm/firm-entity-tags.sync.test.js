const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const serviceInquiryRequestsRepository = require('../../db/supabase/repositories/service-inquiry-requests.repository');
const serviceInquiriesService = require('./service-inquiries.service');

test('update: tagIds na inquiry com leadId sincroniza lead_tag_links', async () => {
  mock.restoreAll();
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => []);
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    firmId: 'firm-x',
    status: 'NEW',
    leadId: 'lead-1',
    notes: null,
  }));
  mock.method(serviceInquiriesRepository, 'updateRow', async () => {
    throw new Error('não deve actualizar row quando só tagIds');
  });

  let inquiryTags = null;
  let leadTags = null;
  mock.method(firmInquiryTagsRepository, 'resolveAllowedTagIds', async (_firmId, tagIds) => tagIds);
  mock.method(firmInquiryTagsRepository, 'replaceLinksForInquiry', async (firmId, inquiryId, tagIds) => {
    inquiryTags = { firmId, inquiryId, tagIds };
    return tagIds;
  });
  mock.method(firmInquiryTagsRepository, 'replaceLinksForLead', async (firmId, leadId, tagIds) => {
    leadTags = { firmId, leadId, tagIds };
    return tagIds;
  });
  mock.method(firmInquiryTagsRepository, 'listLinksForInquiries', async () => [
    {
      service_inquiry_id: 'inquiry-1',
      firm_inquiry_tags: { id: 'tag-1', name: 'VIP', color_hex: '#0F2942' },
    },
  ]);

  const result = await serviceInquiriesService.update({
    firmId: 'firm-x',
    id: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { tagIds: ['tag-1'] },
  });

  assert.deepEqual(inquiryTags, { firmId: 'firm-x', inquiryId: 'inquiry-1', tagIds: ['tag-1'] });
  assert.deepEqual(leadTags, { firmId: 'firm-x', leadId: 'lead-1', tagIds: ['tag-1'] });
  assert.equal(result.inquiry.tags?.[0]?.id, 'tag-1');
});
