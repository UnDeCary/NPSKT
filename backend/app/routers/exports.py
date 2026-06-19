from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.dependencies import get_current_user
from app.models import User
from app.services.pdf import simple_pdf


router = APIRouter(prefix="/api/exports", tags=["exports"], dependencies=[Depends(get_current_user)])


@router.post("/pdf/current")
def export_current_page(user: User = Depends(get_current_user)) -> Response:
    content = simple_pdf("Dashboard NPS KT - current page", [f"Requested by: {user.login}", "Current filters are applied by the frontend request context."])
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=nps-current-page.pdf"})


@router.post("/pdf/all")
def export_all_pages(user: User = Depends(get_current_user)) -> Response:
    content = simple_pdf("Dashboard NPS KT - all pages", [f"Requested by: {user.login}", "Includes home, B2C, B2B, B2C Internet, B2C TV, B2C FMS, and field control."])
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=nps-all-pages.pdf"})
