from fastapi import APIRouter

router = APIRouter(prefix="/gap-analysis")


@router.get("/{developer_id}/{opportunity_id}")
def gap_analysis(developer_id: str, opportunity_id: str):
    return {
        "developer_id": developer_id,
        "opportunity_id": opportunity_id,
        "matched_skills": [],
        "missing_skills": [],
    }


@router.get("/{developer_id}/{opportunity_id}/skill-node/{skill_name}")
def gap_skill_node(developer_id: str, opportunity_id: str, skill_name: str):
    return {
        "developer_id": developer_id,
        "opportunity_id": opportunity_id,
        "skill_name": skill_name,
        "skill_tree_node_id": None,
    }
