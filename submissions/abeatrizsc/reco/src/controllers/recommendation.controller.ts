import { ROUTE_PREFIX } from "../routes/routes";
import { FastifyTypedInstance } from "../types";

export async function recommendationController(app: FastifyTypedInstance) {
    app.get(ROUTE_PREFIX, () => {
        return "Server acessed."
    })
}