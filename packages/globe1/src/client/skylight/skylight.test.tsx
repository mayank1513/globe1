import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, test } from "vitest";
import { Skylight } from "./skylight";

describe.concurrent("skylight", () => {
	afterEach(cleanup);

	test("check if h1 heading exists", ({ expect }) => {
		render(<Skylight />);
		expect(screen.getByTestId("skylight-h1").textContent).toBe("skylight");
	});
});
