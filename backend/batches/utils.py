from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
WD = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
def runs_on(batch, d):
    days = batch.class_days.split(",") if batch.class_days else WD
    return WD[d.weekday()] in days
def class_dates(batch):
    last = min(x for x in (timezone.localdate(), batch.end_date) if x)
    out, d = [], batch.start_date
    while d <= last:
        if runs_on(batch, d): out.append(d)
        d += timedelta(days=1)
    return out
def recording_days(batch):
    recs = {r.date: r for r in batch.recordings.all()}
    return [{"date": d, "weekday": WD[d.weekday()], "title": recs[d].title if d in recs else "", "url": recs[d].url if d in recs else ""}
            for d in sorted(set(class_dates(batch)) | set(recs), reverse=True)]
def live_state(batch, now):
    """Is today a class day, and is the join window (start-10min .. end) open right now?"""
    d = now.date()
    if not (batch.start_time and batch.end_time) or not runs_on(batch, d) or d < batch.start_date or (batch.end_date and d > batch.end_date):
        return {"scheduled": False, "is_open": False}
    start = datetime.combine(d, batch.start_time, tzinfo=now.tzinfo); end = datetime.combine(d, batch.end_time, tzinfo=now.tzinfo)
    return {"scheduled": True, "is_open": start - timedelta(minutes=settings.JOIN_EARLY_MINUTES) <= now <= end, "starts_at": start, "ends_at": end}
