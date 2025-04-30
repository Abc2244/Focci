@router.delete("/tasks/completed/{user_id}")
async def delete_completed_tasks(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        await task_service.delete_completed_tasks(user_id, db)
        return {"message": "tareas completadas eliminadas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/user/{user_id}")
async def clean_user_data(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        await task_service.clean_user_data(user_id, db)
        return {"message": "Se eliminaron los datos del usuario correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 