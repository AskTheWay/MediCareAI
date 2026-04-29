# MediCareAI WeChat Mini Program

This directory contains a WeChat Mini Program frontend adapted to the existing MediCareAI backend APIs.

## Included Features

- Patient login and registration
- Dashboard with case summary
- Symptom submission flow:
  - create medical case
  - upload medical files
  - trigger extraction
  - call AI comprehensive diagnosis
- Medical records list and detail view
- Doctor comments and patient replies
- Profile edit
- Chronic disease management

## Backend Dependency

The app uses:

- Base URL: `https://8.137.177.147/api/v1`
- Header: `X-Platform: patient`
- Token auth: `Bearer <access_token>`

You can change the backend URL in:

- `utils/config.js`

## Open In WeChat DevTools

1. Open WeChat DevTools.
2. Import project folder: `MediCareAI/wechat-miniprogram`.
3. Use `project.config.json` defaults (or bind your real `appid`).
4. Run and test login/registration first.

## Main API Mapping

- Auth: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`, `/auth/refresh`
- Patient: `/patients/me`, `/patients/me/chronic-diseases`
- Cases: `/medical-cases`, `/medical-cases/{id}/doctor-comments`
- AI: `/ai/comprehensive-diagnosis`
- Documents: `/documents/upload`, `/documents/{id}/extract`
- Sharing doctors: `/sharing/doctors`
- Disease dictionary: `/chronic-diseases`

## Notes

- Token auto-refresh is implemented in `utils/request.js`.
- If refresh fails, app clears session and returns to login page.
- AI diagnosis uses non-stream endpoint for Mini Program compatibility.
